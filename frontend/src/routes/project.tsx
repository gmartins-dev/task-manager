import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../util/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
};

const STATUS_OPTIONS: Task['status'][] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const statusLabel = (status: Task['status']) => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
};

const statusVariant = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'secondary' as const;
    case 'IN_PROGRESS':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Task['status']>('PENDING');
  const [formError, setFormError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status: Task['status'] | 'all'; sort: 'dueDateAsc' | 'dueDateDesc' }>({
    status: 'all',
    sort: 'dueDateAsc',
  });

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: async () => api(`/projects/${id}`, { credentials: 'include' }).then((r) => r.project as Project),
    enabled: Boolean(id),
  });

  const tasksQuery = useQuery({
    queryKey: ['project', id, 'tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      params.set('sort', filters.sort);
      const url = `/projects/${id}/tasks${params.size ? `?${params.toString()}` : ''}`;
      return api(url, { credentials: 'include' }).then((r) => r.tasks as Task[]);
    },
    enabled: Boolean(id),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Task title is required');
      return api(`/projects/${id}/tasks`, {
        method: 'POST',
        credentials: 'include',
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: new Date(`${dueDate}T00:00:00`).toISOString(),
          status,
        },
      });
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setStatus('PENDING');
      setDueDate(new Date().toISOString().slice(0, 10));
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
    onError: (error: unknown) => {
      setFormError(error instanceof Error ? error.message : 'Unable to create task');
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, nextStatus }: { taskId: string; nextStatus: Task['status'] }) =>
      api(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { status: nextStatus },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      api(`/projects/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
  });

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading project…</p>;
  }
  if (!projectQuery.data) {
    return <p className="text-sm text-destructive">Project not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{projectQuery.data.name}</h1>
        {projectQuery.data.description && (
          <p className="max-w-3xl text-sm text-muted-foreground">{projectQuery.data.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a task</CardTitle>
          <CardDescription>Add work items to track progress within this project.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value: Task['status']) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {statusLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formError && <p className="text-sm text-destructive md:col-span-2">{formError}</p>}
          <div className="md:col-span-2">
            <Button onClick={() => createTask.mutate()} disabled={createTask.isPending}>
              {createTask.isPending ? 'Adding task...' : 'Add task'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex flex-wrap gap-3">
              <Select
                value={filters.status}
                onValueChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, status: value as Task['status'] | 'all' }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {statusLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.sort}
                onValueChange={(value: 'dueDateAsc' | 'dueDateDesc') =>
                  setFilters((prev) => ({ ...prev, sort: value }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sort by due date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDateAsc">Due soonest</SelectItem>
                  <SelectItem value="dueDateDesc">Due latest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Filter tasks by status and reorder them by due date to spot upcoming work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasksQuery.isError && (
            <p className="text-sm text-destructive">Unable to load tasks. Please try again later.</p>
          )}
          {!tasksQuery.isError && tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet. Create your first task above.</p>
          )}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/40 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={statusVariant(task.status)}>{statusLabel(task.status)}</Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <Select
                    value={task.status}
                    onValueChange={(value: Task['status']) =>
                      updateTaskStatus.mutate({ taskId: task.id, nextStatus: value })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {statusLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteTask.mutate(task.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
      return 'Pendente';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluida';
    default:
      return status;
  }
};

const statusVariant = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'completed' as const;
    case 'IN_PROGRESS':
      return 'progress' as const;
    default:
      return 'pending' as const;
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
      if (!title.trim()) throw new Error('O titulo da tarefa e obrigatorio');
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
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar a tarefa');
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
    return <p className="text-sm text-muted-foreground">Carregando projeto...</p>;
  }
  if (!projectQuery.data) {
    return <p className="text-sm text-destructive">Projeto nao encontrado.</p>;
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
          <CardTitle>Criar tarefa</CardTitle>
          <CardDescription>Adicione atividades para acompanhar o progresso deste projeto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Input
              placeholder="Titulo da tarefa"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <Textarea
            placeholder="Descricao (opcional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Data de entrega</label>
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
              {createTask.isPending ? 'Adicionando tarefa...' : 'Adicionar tarefa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Tarefas</CardTitle>
            <div className="flex flex-wrap gap-3">
              <Select
                value={filters.status}
                onValueChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, status: value as Task['status'] | 'all' }))
                }
              >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
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
                  <SelectValue placeholder="Ordenar por data de entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDateAsc">Mais proximas</SelectItem>
                  <SelectItem value="dueDateDesc">Mais distantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            Filtre as tarefas por status e reordene pela data de entrega para priorizar o trabalho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasksQuery.isError && (
            <p className="text-sm text-destructive">Nao foi possivel carregar as tarefas. Tente novamente mais tarde.</p>
          )}
          {!tasksQuery.isError && tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda nao ha tarefas. Crie a primeira usando o formulario acima.</p>
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
                    Entrega em {new Date(task.dueDate).toLocaleDateString()}
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
                      <SelectValue placeholder="Atualizar status" />
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
                    Remover
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

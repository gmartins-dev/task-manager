import { useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../util/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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

const STATUS_COLUMNS: Array<{ value: Task['status']; label: string }> = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluida' },
];

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

type UpdateTaskVariables = { taskId: string; nextStatus: Task['status'] };

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Task['status']>('PENDING');
  const [formError, setFormError] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [filters, setFilters] = useState<{ status: Task['status'] | 'all'; sort: 'dueDateAsc' | 'dueDateDesc' }>({
    status: 'all',
    sort: 'dueDateAsc',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const tasksQueryKey = ['project', id, 'tasks', filters] as const;

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: async () => api(`/projects/${id}`, { credentials: 'include' }).then((r) => r.project as Project),
    enabled: Boolean(id),
  });

  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      params.set('sort', filters.sort);
      const url = `/projects/${id}/tasks${params.size ? `?${params.toString()}` : ''}`;
      return api(url, { credentials: 'include' }).then((r) => r.tasks as Task[]);
    },
    enabled: Boolean(id),
  });

  const tasks = tasksQuery.data ?? [];

  const tasksByStatus = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<Task['status'], Task[]>>((acc, column) => {
      acc[column] = tasks.filter((task) => task.status === column);
      return acc;
    }, { PENDING: [], IN_PROGRESS: [], COMPLETED: [] });
  }, [tasks]);

  const sortedTableTasks = useMemo(() => {
    const clone = [...tasks];
    return clone.sort((a, b) => {
      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      return aTime - bTime;
    });
  }, [tasks]);

  const createTask = useMutation({
    mutationFn: async () =>
      api(`/projects/${id}/tasks`, {
        method: 'POST',
        credentials: 'include',
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: new Date(`${dueDate}T00:00:00`).toISOString(),
          status,
        },
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setStatus('PENDING');
      setDueDate(new Date().toISOString().slice(0, 10));
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
    onError: () => setFormError('Nao foi possivel criar a tarefa'),
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, nextStatus }: UpdateTaskVariables) =>
      api(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { status: nextStatus },
      }),
    onMutate: async ({ taskId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['project', id, 'tasks'] });
      const previous = queryClient.getQueryData<Task[]>(tasksQueryKey);
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tasksQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
  });

  const handleCreateTask = () => {
    if (!title.trim()) {
      setFormError('Informe um titulo para a tarefa');
      return;
    }
    createTask.mutate();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const currentStatus = active.data.current?.column as Task['status'] | undefined;
    const overColumn =
      (over.data.current?.column as Task['status'] | undefined) ||
      (STATUS_OPTIONS.includes(over.id as Task['status']) ? (over.id as Task['status']) : undefined);

    if (!currentStatus || !overColumn || currentStatus === overColumn) return;

    updateTaskStatus.mutate({ taskId: String(active.id), nextStatus: overColumn });
  };

  const showDescriptionColumn = useMemo(
    () => sortedTableTasks.some((task) => Boolean(task.description)),
    [sortedTableTasks],
  );

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tabela de tarefas</CardTitle>
        <CardDescription>Visualizacao em lista das tarefas do projeto.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedTableTasks.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Nenhuma tarefa encontrada para este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-6 font-medium">Titulo</th>
                  <th className="py-2 pr-6 font-medium">Status</th>
                  <th className="py-2 pr-6 font-medium">Entrega</th>
                  {showDescriptionColumn && <th className="py-2 pr-6 font-medium">Descricao</th>}
                </tr>
              </thead>
              <tbody>
                {sortedTableTasks.map((task) => (
                  <tr key={task.id} className="border-b last:border-0">
                    <td className="py-3 pr-6 align-top font-medium text-foreground">
                      {task.title}
                    </td>
                    <td className="py-3 pr-6 align-top">
                      <Badge variant={statusVariant(task.status)}>{statusLabel(task.status)}</Badge>
                    </td>
                    <td className="py-3 pr-6 align-top text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    {showDescriptionColumn && (
                      <td className="py-3 pr-6 align-top text-muted-foreground">
                        {task.description ?? '---'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderKanbanView = () => (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>Kanban</CardTitle>
        <CardDescription>Arraste e solte as tarefas entre as colunas.</CardDescription>
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value as Task['status'] | 'all' }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_COLUMNS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
              <SelectValue placeholder="Ordenar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDateAsc">Mais proximas</SelectItem>
              <SelectItem value="dueDateDesc">Mais distantes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {STATUS_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.value}
                status={column.value}
                label={column.label}
                tasks={
                  filters.status === 'all' || filters.status === column.value
                    ? tasksByStatus[column.value]
                    : []
                }
              />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando dados do projeto...</p>;
  }

  if (!projectQuery.data) {
    return <p className="text-sm text-destructive">Projeto nao encontrado.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{projectQuery.data.name}</h1>
          {projectQuery.data.description && (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {projectQuery.data.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>
            Tabela
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            onClick={() => setView('kanban')}
          >
            Kanban
          </Button>
        </div>
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
                {STATUS_COLUMNS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formError && <p className="text-sm text-destructive md:col-span-2">{formError}</p>}
          <div className="md:col-span-2">
            <Button onClick={handleCreateTask} disabled={createTask.isPending}>
              {createTask.isPending ? 'Adicionando tarefa...' : 'Adicionar tarefa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {view === 'table' ? renderTableView() : renderKanbanView()}
    </div>
  );
}

type KanbanColumnProps = {
  status: Task['status'];
  label: string;
  tasks: Task[];
};

function KanbanColumn({ status, label, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { column: status },
  });

  return (
    <div className="flex h-full flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-3">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="rounded border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
              Nenhuma tarefa neste status.
            </p>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { column: task.status },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm transition ${
        isDragging ? 'border-primary shadow-lg' : 'hover:border-primary/60'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{task.title}</span>
        <Badge variant={statusVariant(task.status)}>{statusLabel(task.status)}</Badge>
      </div>
      {task.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{task.description}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Entrega em {new Date(task.dueDate).toLocaleDateString()}
      </p>
    </div>
  );
}

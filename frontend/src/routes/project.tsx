import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from 'lucide-react';
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
import { cn } from '../lib/utils';

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

export type TaskStatus = typeof STATUS_OPTIONS[number];

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate: string;
};

const STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    badgeVariant: 'pending' | 'progress' | 'completed';
    textClass: string;
    dotClass: string;
    order: number;
  }
> = {
  PENDING: {
    label: 'Pendente',
    badgeVariant: 'pending',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
    order: 0,
  },
  IN_PROGRESS: {
    label: 'Em andamento',
    badgeVariant: 'progress',
    textClass: 'text-sky-700',
    dotClass: 'bg-sky-500',
    order: 1,
  },
  COMPLETED: {
    label: 'Concluida',
    badgeVariant: 'completed',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
    order: 2,
  },
};

const STATUS_COLUMNS: Array<{ value: TaskStatus; label: string }> = STATUS_OPTIONS.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

const STATUS_ORDER: Record<TaskStatus, number> = STATUS_OPTIONS.reduce(
  (acc, status) => ({ ...acc, [status]: STATUS_META[status].order }),
  { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2 },
);

const taskFormSchema = z.object({
  title: z.string().min(1, 'Informe um titulo'),
  description: z.string().optional(),
  status: z.enum(STATUS_OPTIONS),
  dueDate: z.string().min(1, 'Informe a data de entrega'),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const statusLabel = (status: TaskStatus) => STATUS_META[status]?.label ?? status;

const statusVariant = (status: TaskStatus) => STATUS_META[status]?.badgeVariant ?? 'pending';

const statusTextClass = (status: TaskStatus) =>
  STATUS_META[status]?.textClass ?? 'text-muted-foreground';

const statusDotClass = (status: TaskStatus) =>
  STATUS_META[status]?.dotClass ?? 'bg-muted-foreground/50';

type TableSortColumn = 'title' | 'status' | 'dueDate';
type TableSortDirection = 'asc' | 'desc';
export type TaskTableSort = { column: TableSortColumn; direction: TableSortDirection };

const renderStatusOptionContent = (status: TaskStatus) => (
  <span className="flex items-center gap-2">
    <span className={cn('h-2 w-2 rounded-full', statusDotClass(status))} />
    <span className={cn('font-medium', statusTextClass(status))}>{statusLabel(status)}</span>
  </span>
);

const compareTitle = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const toTimestamp = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export function sortTasksForTable(tasks: Task[], sort: TaskTableSort) {
  const clone = [...tasks];
  return clone.sort((taskA, taskB) => {
    switch (sort.column) {
      case 'title': {
        const comparison = compareTitle(taskA.title, taskB.title);
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      case 'status': {
        const comparison = STATUS_ORDER[taskA.status] - STATUS_ORDER[taskB.status];
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
        const dateCompare = toTimestamp(taskA.dueDate) - toTimestamp(taskB.dueDate);
        if (dateCompare !== 0) {
          return sort.direction === 'asc' ? dateCompare : -dateCompare;
        }
        const titleFallback = compareTitle(taskA.title, taskB.title);
        return sort.direction === 'asc' ? titleFallback : -titleFallback;
      }
      case 'dueDate':
      default: {
        const comparison = toTimestamp(taskA.dueDate) - toTimestamp(taskB.dueDate);
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
        const titleFallback = compareTitle(taskA.title, taskB.title);
        return sort.direction === 'asc' ? titleFallback : -titleFallback;
      }
    }
  });
}

const formatDateForInput = (iso: string) => {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
};

type UpdateTaskVariables = { taskId: string; nextStatus: TaskStatus };

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [formError, setFormError] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [filters, setFilters] = useState<{ status: TaskStatus | 'all'; sort: 'dueDateAsc' | 'dueDateDesc' }>({
    status: 'all',
    sort: 'dueDateAsc',
  });
  const [tableSort, setTableSort] = useState<TaskTableSort>({
    column: 'dueDate',
    direction: filters.sort === 'dueDateAsc' ? 'asc' : 'desc',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    return STATUS_OPTIONS.reduce<Record<TaskStatus, Task[]>>((acc, column) => {
      acc[column] = tasks.filter((task) => task.status === column);
      return acc;
    }, { PENDING: [], IN_PROGRESS: [], COMPLETED: [] });
  }, [tasks]);

  const sortedTableTasks = useMemo(() => sortTasksForTable(tasks, tableSort), [tasks, tableSort]);

  const handleTableSort = (column: TableSortColumn) => {
    setTableSort((previous) => {
      const isSameColumn = previous.column === column;
      const nextDirection = isSameColumn
        ? previous.direction === 'asc'
          ? 'desc'
          : 'asc'
        : column === 'dueDate'
          ? filters.sort === 'dueDateDesc'
            ? 'desc'
            : 'asc'
          : 'asc';

      const nextSort: TaskTableSort = { column, direction: nextDirection };

      if (column === 'dueDate') {
        setFilters((prev) => ({
          ...prev,
          sort: nextDirection === 'asc' ? 'dueDateAsc' : 'dueDateDesc',
        }));
      }

      return nextSort;
    });
  };

  const getAriaSort = (column: TableSortColumn): 'ascending' | 'descending' | 'none' => {
    if (tableSort.column !== column) return 'none';
    return tableSort.direction === 'asc' ? 'ascending' : 'descending';
  };

  const renderSortIcon = (column: TableSortColumn) => {
    if (tableSort.column !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" aria-hidden />;
    }
    if (tableSort.direction === 'asc') {
      return <ArrowUp className="h-3.5 w-3.5" aria-hidden />;
    }
    return <ArrowDown className="h-3.5 w-3.5" aria-hidden />;
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
  };

  const closeTaskDetails = () => setSelectedTask(null);

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

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id: taskId,
      data,
    }: {
      id: string;
      data: { title: string; description?: string; status: TaskStatus; dueDate: string };
    }) =>
      api(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) =>
      api(`/projects/tasks/${taskId}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'tasks'] });
      setSelectedTask(null);
    },
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

  const handleUpdateTask = async (values: TaskFormValues) => {
    if (!selectedTask) return;
    try {
      const trimmedDescription = (values.description ?? '').trim();
      const dueDateValue = values.dueDate ?? '';
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: {
          title: values.title,
          description: trimmedDescription ? trimmedDescription : undefined,
          status: values.status,
          dueDate: new Date(dueDateValue).toISOString(),
        },
      });
      closeTaskDetails();
    } catch {
      // keep dialog open so user can ajustar
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      closeTaskDetails();
    } catch {
      // ignore
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const currentStatus = active.data.current?.column as TaskStatus | undefined;
    const overColumn =
      (over.data.current?.column as TaskStatus | undefined) ||
      (STATUS_OPTIONS.includes(over.id as TaskStatus) ? (over.id as TaskStatus) : undefined);

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
                <tr className="border-b text-left text-xs uppercase">
                  <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('title')}>
                    <button
                      type="button"
                      onClick={() => handleTableSort('title')}
                      className={cn(
                        'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                        tableSort.column === 'title' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span>Titulo</span>
                      {renderSortIcon('title')}
                    </button>
                  </th>
                  <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('status')}>
                    <button
                      type="button"
                      onClick={() => handleTableSort('status')}
                      className={cn(
                        'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                        tableSort.column === 'status' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('dueDate')}>
                    <button
                      type="button"
                      onClick={() => handleTableSort('dueDate')}
                      className={cn(
                        'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                        tableSort.column === 'dueDate' ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span>Entrega</span>
                      {renderSortIcon('dueDate')}
                    </button>
                  </th>
                  {showDescriptionColumn && <th className="py-2 pr-6 font-medium">Descricao</th>}
                </tr>
              </thead>
              <tbody>
                {sortedTableTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                    onClick={() => openTaskDetails(task)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openTaskDetails(task);
                      }
                    }}
                  >
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
                onOpenTask={openTaskDetails}
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
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">{projectQuery.data.name}</h1>
        {projectQuery.data.description && (
          <p className="max-w-3xl text-sm text-muted-foreground">
            {projectQuery.data.description}
          </p>
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
            <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
              <SelectTrigger className={statusTextClass(status)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_COLUMNS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {renderStatusOptionContent(option.value)}
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

      <div className="flex flex-col gap-3 rounded-lg border bg-card/40 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value as TaskStatus | 'all' }))
            }
          >
            <SelectTrigger
              className={cn(
                'w-48',
                filters.status !== 'all' ? statusTextClass(filters.status) : 'text-muted-foreground',
              )}
            >
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span className="font-medium text-muted-foreground">Todos os status</span>
                </span>
              </SelectItem>
              {STATUS_COLUMNS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {renderStatusOptionContent(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Select
            value={filters.sort}
            onValueChange={(value: 'dueDateAsc' | 'dueDateDesc') => {
              setFilters((prev) => ({ ...prev, sort: value }));
              setTableSort({ column: 'dueDate', direction: value === 'dueDateAsc' ? 'asc' : 'desc' });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDateAsc">Mais proximas</SelectItem>
              <SelectItem value="dueDateDesc">Mais distantes</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
            >
              Tabela
            </Button>
            <Button
              variant={view === 'kanban' ? 'default' : 'outline'}
              onClick={() => setView('kanban')}
              aria-pressed={view === 'kanban'}
            >
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {view === 'table' ? renderTableView() : renderKanbanView()}
      {selectedTask && (
        <TaskDetailsDialog
          key={selectedTask.id}
          task={selectedTask}
          onClose={closeTaskDetails}
          onSubmit={handleUpdateTask}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          saving={updateTaskMutation.isPending}
          deleting={deleteTask.isPending}
        />
      )}
    </div>
  );
}

type KanbanColumnProps = {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
};

function KanbanColumn({ status, label, tasks, onOpenTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { column: status },
  });

  return (
    <div className="flex h-full flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium">
        <span className={cn('flex items-center gap-2', statusTextClass(status))}>
          <span className={cn('h-2 w-2 rounded-full', statusDotClass(status))} />
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-3">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="rounded border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
              Nenhuma tarefa neste status.
            </p>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} onOpenTask={onOpenTask} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanCard({ task, onOpenTask }: { task: Task; onOpenTask: (task: Task) => void }) {
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
      onClick={() => onOpenTask(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="cursor-grab rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <span className="font-medium text-foreground">{task.title}</span>
        </div>
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

type TaskDetailsDialogProps = {
  task: Task;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
  saving: boolean;
  deleting: boolean;
};

function TaskDetailsDialog({ task, onClose, onSubmit, onDelete, saving, deleting }: TaskDetailsDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: formatDateForInput(task.dueDate),
    },
  });
  const statusValue = form.watch('status') as TaskStatus;

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: formatDateForInput(task.dueDate),
    });
  }, [task, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleDelete = async () => {
    await onDelete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-card-foreground">Detalhes da tarefa</h2>
            <p className="text-xs text-muted-foreground">
              Edite as informacoes e salve para atualizar. As alteracoes sao sincronizadas automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="task-title">
              Titulo
            </label>
            <Input id="task-title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="task-description">
              Descricao
            </label>
            <Textarea id="task-description" rows={4} {...form.register('description')} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={statusValue}
                onValueChange={(value: TaskStatus) => form.setValue('status', value)}
              >
                <SelectTrigger className={statusTextClass(statusValue)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLUMNS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {renderStatusOptionContent(option.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="task-due-date">
                Data de entrega
              </label>
              <Input id="task-due-date" type="date" {...form.register('dueDate')} />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Removendo...' : 'Excluir'}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

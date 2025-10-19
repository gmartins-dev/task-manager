import { useState } from 'react';
import { type DragEndEvent } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useKanbanSensors } from './hooks/use-kanban-sensors';
import { useProjectData } from './hooks/use-project-data';
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type Task,
  type TaskFilters,
  type TaskTableSort,
  type TaskStatus,
  type ViewMode,
} from './types';
import { ProjectHeader } from './components/project-header';
import { TaskFiltersBar } from './components/task-filters-bar';
import { TaskTable } from './components/task-table';
import { KanbanBoard } from './components/kanban-board';
import { CreateTaskDialog, TaskDetailsDialog } from './components/task-dialogs';
import { TaskFormValues } from './schemas';
import { STATUS_OPTIONS } from './constants';

type ProjectPageProps = {
  projectId: string;
};

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [view, setView] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [tableSort, setTableSort] = useState<TaskTableSort>({
    column: DEFAULT_SORT.column,
    direction: filters.sort === 'dueDateAsc' ? 'asc' : 'desc',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus | null>(null);
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);

  const sensors = useKanbanSensors();

  const {
    projectQuery,
    tasksQuery,
    tasks,
    tasksByStatus,
    sortedTableTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  } = useProjectData({ projectId, filters, tableSort });

  const handleViewChange = (mode: ViewMode) => {
    setView(mode);
  };

  const handleStatusFilterChange = (status: TaskFilters['status']) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleSortChange = (sort: TaskFilters['sort']) => {
    setFilters((prev) => ({ ...prev, sort }));
    setTableSort({ column: 'dueDate', direction: sort === 'dueDateAsc' ? 'asc' : 'desc' });
  };

  const handleTableSortChange = (column: TaskTableSort['column']) => {
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

      if (column === 'dueDate') {
        setFilters((prev) => ({
          ...prev,
          sort: nextDirection === 'asc' ? 'dueDateAsc' : 'dueDateDesc',
        }));
      }

      return { column, direction: nextDirection };
    });
  };

  const handleOpenTask = (task: Task) => setSelectedTask(task);
  const handleCloseTask = () => setSelectedTask(null);

  const handleOpenCreateTask = (status: TaskStatus) => {
    setCreateTaskStatus(status);
    setCreateTaskError(null);
  };
  const handleCloseCreateTask = () => {
    setCreateTaskStatus(null);
    setCreateTaskError(null);
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setCreateTaskError('Informe um titulo para a tarefa');
      return;
    }
    const trimmedDescription = values.description?.trim() ?? '';
    try {
      setCreateTaskError(null);
      await createTask.mutateAsync({
        title: trimmedTitle,
        description: trimmedDescription ? trimmedDescription : undefined,
        dueDate: values.dueDate,
        status: values.status,
      });
      handleCloseCreateTask();
    } catch (error) {
      setCreateTaskError(
        error instanceof Error ? error.message : 'Nao foi possivel criar a tarefa',
      );
    }
  };

  const handleUpdateTask = async (values: TaskFormValues) => {
    if (!selectedTask) return;
    try {
      const trimmedDescription = values.description?.trim() ?? '';
      await updateTask.mutateAsync({
        id: selectedTask.id,
        data: {
          title: values.title,
          description: trimmedDescription ? trimmedDescription : undefined,
          status: values.status,
          dueDate: new Date(values.dueDate).toISOString(),
        },
      });
      handleCloseTask();
    } catch {
      // keep modal open
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await deleteTask.mutateAsync(selectedTask.id);
      handleCloseTask();
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
      (over.id && STATUS_OPTIONS.includes(over.id as TaskStatus)
        ? (over.id as TaskStatus)
        : undefined);

    if (!currentStatus || !overColumn || currentStatus === overColumn) return;

    updateTaskStatus.mutate({ taskId: String(active.id), nextStatus: overColumn });
  };

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando dados do projeto...</p>;
  }

  if (!projectQuery.data) {
    return <p className="text-sm text-destructive">Projeto nao encontrado.</p>;
  }

  return (
    <div className="space-y-8">
      <ProjectHeader project={projectQuery.data} />

      <TaskFiltersBar
        filters={filters}
        view={view}
        onStatusChange={handleStatusFilterChange}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
      />

      {view === 'kanban' && (
        <Card>
          <CardHeader>
            <CardTitle>Kanban</CardTitle>
            <CardDescription>Arraste e solte as tarefas entre as colunas.</CardDescription>
          </CardHeader>
          <CardContent>
            <KanbanBoard
              tasksByStatus={tasksByStatus}
              filters={filters}
              sensors={sensors}
              onOpenTask={handleOpenTask}
              onCreateTask={handleOpenCreateTask}
              onDragEnd={handleDragEnd}
            />
          </CardContent>
        </Card>
      )}

      {view === 'table' && (
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
              <TaskTable
                tasks={sortedTableTasks}
                sort={tableSort}
                onSortChange={handleTableSortChange}
                onSelectTask={handleOpenTask}
              />
            )}
          </CardContent>
        </Card>
      )}

      <TaskDetailsDialog
        task={selectedTask}
        saving={updateTask.isPending}
        deleting={deleteTask.isPending}
        onClose={handleCloseTask}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <CreateTaskDialog
        defaultStatus={createTaskStatus ?? 'PENDING'}
        open={createTaskStatus !== null}
        saving={createTask.isPending}
        errorMessage={createTaskError}
        onClose={handleCloseCreateTask}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}

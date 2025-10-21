import { DndContext, closestCorners, type DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import {
  STATUS_COLUMNS,
  statusDotClass,
  statusLabel,
  statusTextClass,
  statusVariant,
  type TaskStatus,
} from '../constants';
import { type Task, type TaskByStatus, type TaskFilters } from '../types';
import { formatTaskDueDate } from '../utils/sorting';
import type { KanbanSensors } from '../hooks/use-kanban-sensors';

interface KanbanBoardProps {
  tasksByStatus: TaskByStatus;
  filters: TaskFilters;
  sensors: KanbanSensors;
  onOpenTask: (task: Task) => void;
  onCreateTask: (status: TaskStatus) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function KanbanBoard({ tasksByStatus, filters, sensors, onOpenTask, onCreateTask, onDragEnd }: KanbanBoardProps) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
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
            onOpenTask={onOpenTask}
            onCreateTask={onCreateTask}
          />
        ))}
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onCreateTask: (status: TaskStatus) => void;
}

function KanbanColumn({ status, label, tasks, onOpenTask, onCreateTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { column: status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver ? 'border-primary/60 bg-primary/5' : null,
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-medium">
        <span className={cn('flex items-center gap-2', statusTextClass(status))}>
          <span className={cn('h-2 w-2 rounded-full', statusDotClass(status))} />
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onCreateTask(status)}
            aria-label={`Adicionar tarefa em ${label}`}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 p-3">
          {tasks.length === 0 ? (
            <p className="rounded border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
              Nenhuma tarefa neste status.
            </p>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} onOpenTask={onOpenTask} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface KanbanCardProps {
  task: Task;
  onOpenTask: (task: Task) => void;
}

function KanbanCard({ task, onOpenTask }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { column: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card p-3 text-sm shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDragging ? 'border-primary shadow-lg' : 'hover:border-primary/60',
      )}
      onClick={() => onOpenTask(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenTask(task);
        }
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-foreground line-clamp-2">{task.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant={statusVariant(task.status)}
            className="whitespace-nowrap px-2 py-0.5 text-xs font-semibold"
          >
            {statusLabel(task.status)}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onOpenTask(task);
            }}
            aria-label={`Editar ${task.title}`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
      {task.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{task.description}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Entrega em {formatTaskDueDate(task.dueDate)}
      </p>
    </div>
  );
}

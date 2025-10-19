import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  STATUS_COLUMNS,
  statusDotClass,
  statusTextClass,
  type TaskStatus,
} from '../constants';
import { type TaskFilters, type ViewMode } from '../types';
import { cn } from '../../../lib/utils';

type TaskFiltersBarProps = {
  filters: TaskFilters;
  view: ViewMode;
  onStatusChange: (status: TaskFilters['status']) => void;
  onSortChange: (sort: TaskFilters['sort']) => void;
  onViewChange: (view: ViewMode) => void;
};

export function TaskFiltersBar({
  filters,
  view,
  onStatusChange,
  onSortChange,
  onViewChange,
}: TaskFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card/40 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-3">
        <Select value={filters.status} onValueChange={(value) => onStatusChange(value as TaskFilters['status'])}>
          <SelectTrigger
            className={cn(
              'w-48',
              filters.status !== 'all' ? statusTextClass(filters.status as TaskStatus) : 'text-muted-foreground',
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
                <span className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', statusDotClass(option.value))} />
                  <span className={cn('font-medium', statusTextClass(option.value))}>{option.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <Select
          value={filters.sort}
          onValueChange={(value: TaskFilters['sort']) => onSortChange(value)}
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
            onClick={() => onViewChange('table')}
            aria-pressed={view === 'table'}
          >
            Tabela
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            onClick={() => onViewChange('kanban')}
            aria-pressed={view === 'kanban'}
          >
            Kanban
          </Button>
        </div>
      </div>
    </div>
  );
}

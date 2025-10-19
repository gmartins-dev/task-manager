import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import { statusLabel, statusVariant } from '../constants';
import { formatTaskDueDate, shouldShowDescriptionColumn } from '../utils/sorting';
import { type Task, type TaskTableSort } from '../types';

type TaskTableProps = {
  tasks: Task[];
  sort: TaskTableSort;
  onSortChange: (column: TaskTableSort['column']) => void;
  onSelectTask: (task: Task) => void;
};

export function TaskTable({ tasks, sort, onSortChange, onSelectTask }: TaskTableProps) {
  const showDescriptionColumn = shouldShowDescriptionColumn(tasks);

  const getAriaSort = (column: TaskTableSort['column']): 'ascending' | 'descending' | 'none' =>
    sort.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  const renderSortIcon = (column: TaskTableSort['column']) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" aria-hidden />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" aria-hidden />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase">
            <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('title')}>
              <button
                type="button"
                onClick={() => onSortChange('title')}
                className={cn(
                  'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                  sort.column === 'title' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span>Titulo</span>
                {renderSortIcon('title')}
              </button>
            </th>
            <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('status')}>
              <button
                type="button"
                onClick={() => onSortChange('status')}
                className={cn(
                  'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                  sort.column === 'status' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span>Status</span>
                {renderSortIcon('status')}
              </button>
            </th>
            <th className="py-2 pr-6 font-medium" aria-sort={getAriaSort('dueDate')}>
              <button
                type="button"
                onClick={() => onSortChange('dueDate')}
                className={cn(
                  'flex w-full items-center gap-2 text-left font-medium tracking-wide transition-colors',
                  sort.column === 'dueDate' ? 'text-foreground' : 'text-muted-foreground',
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
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
              onClick={() => onSelectTask(task)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectTask(task);
                }
              }}
            >
              <td className="py-3 pr-6 align-middle font-medium text-foreground">{task.title}</td>
              <td className="py-3 pr-6 align-middle">
                <Badge
                  variant={statusVariant(task.status)}
                  className="justify-center whitespace-nowrap px-3 py-0.5 text-xs font-semibold"
                >
                  {statusLabel(task.status)}
                </Badge>
              </td>
              <td className="py-3 pr-6 align-middle text-muted-foreground">
                {formatTaskDueDate(task.dueDate)}
              </td>
              {showDescriptionColumn && (
                <td className="py-3 pr-6 align-middle text-muted-foreground">
                  {task.description ?? '---'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

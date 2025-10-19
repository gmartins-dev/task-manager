export const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export type TaskStatus = typeof STATUS_OPTIONS[number];

export const STATUS_META: Record<
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

export const STATUS_COLUMNS = STATUS_OPTIONS.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}));

export const STATUS_ORDER: Record<TaskStatus, number> = STATUS_OPTIONS.reduce(
  (acc, status) => ({ ...acc, [status]: STATUS_META[status].order }),
  { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2 },
);

export const statusLabel = (status: TaskStatus) => STATUS_META[status]?.label ?? status;

export const statusVariant = (status: TaskStatus) => STATUS_META[status]?.badgeVariant ?? 'pending';

export const statusTextClass = (status: TaskStatus) =>
  STATUS_META[status]?.textClass ?? 'text-muted-foreground';

export const statusDotClass = (status: TaskStatus) =>
  STATUS_META[status]?.dotClass ?? 'bg-muted-foreground/50';

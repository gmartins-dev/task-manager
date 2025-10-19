import { type TaskStatus } from './constants';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate: string;
};

export type TaskTableColumn = 'title' | 'status' | 'dueDate';
export type TaskTableDirection = 'asc' | 'desc';

export type TaskTableSort = {
  column: TaskTableColumn;
  direction: TaskTableDirection;
};

export type TaskFilters = {
  status: TaskStatus | 'all';
  sort: 'dueDateAsc' | 'dueDateDesc';
};

export const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  sort: 'dueDateAsc',
};

export const DEFAULT_SORT: TaskTableSort = {
  column: 'dueDate',
  direction: 'asc',
};

export type UpdateTaskVariables = {
  taskId: string;
  nextStatus: TaskStatus;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
};

export type UpdateTaskPayload = {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: string;
};

export type DeleteTaskPayload = string;

export type TaskByStatus = Record<TaskStatus, Task[]>;

export type ViewMode = 'table' | 'kanban';

export type SensorsConfig = {
  distance?: number;
};

export type StatusFilterOption = TaskStatus | 'all';

export { type TaskStatus, STATUS_OPTIONS } from './constants';

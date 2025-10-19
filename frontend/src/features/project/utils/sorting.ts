import { STATUS_ORDER, type TaskStatus } from '../constants';
import { type Task, type TaskTableSort } from '../types';

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

export const shouldShowDescriptionColumn = (tasks: Task[]) =>
  tasks.some((task) => Boolean(task.description));

export const formatDateForInput = (iso: string) => {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
};

export const formatTaskDueDate = (dueDate: string) =>
  new Date(dueDate).toLocaleDateString();

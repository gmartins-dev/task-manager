import { describe, expect, it } from 'vitest';
import { sortTasksForTable } from '../utils/sorting';
import { type TaskTableSort, type Task } from '../types';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Criar layout',
    description: null,
    status: 'IN_PROGRESS',
    dueDate: '2024-10-15T12:00:00.000Z',
  },
  {
    id: '2',
    title: 'Atualizar backlog',
    description: null,
    status: 'PENDING',
    dueDate: '2024-10-05T12:00:00.000Z',
  },
  {
    id: '3',
    title: 'Revisar testes',
    description: null,
    status: 'COMPLETED',
    dueDate: '2024-09-25T12:00:00.000Z',
  },
  {
    id: '4',
    title: 'Ajustar build',
    description: null,
    status: 'PENDING',
    dueDate: '2024-10-01T12:00:00.000Z',
  },
];

const orderIds = (tasks: Task[]) => tasks.map((task) => task.id);

const sort = (column: TaskTableSort['column'], direction: TaskTableSort['direction']) =>
  sortTasksForTable(mockTasks, { column, direction });

describe('sortTasksForTable', () => {
  it('ordena por data de entrega crescente', () => {
    expect(orderIds(sort('dueDate', 'asc'))).toEqual(['3', '4', '2', '1']);
  });

  it('ordena por data de entrega decrescente', () => {
    expect(orderIds(sort('dueDate', 'desc'))).toEqual(['1', '2', '4', '3']);
  });

  it('ordena por titulo em ordem alfabetica', () => {
    expect(orderIds(sort('title', 'asc'))).toEqual(['4', '2', '1', '3']);
  });

  it('ordena por status respeitando prioridade e usa data como desempate', () => {
    expect(orderIds(sort('status', 'asc'))).toEqual(['4', '2', '1', '3']);
    expect(orderIds(sort('status', 'desc'))).toEqual(['3', '1', '2', '4']);
  });

  it('nao altera o array original', () => {
    const snapshot = [...mockTasks];
    sort('title', 'asc');
    expect(mockTasks).toEqual(snapshot);
  });
});

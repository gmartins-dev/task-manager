import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../util/api';
import { STATUS_OPTIONS, type TaskStatus } from '../constants';
import {
  type CreateTaskPayload,
  type DeleteTaskPayload,
  type Task,
  type TaskByStatus,
  type TaskFilters,
  type TaskTableSort,
  type UpdateTaskPayload,
  type UpdateTaskVariables,
} from '../types';
import { sortTasksForTable } from '../utils/sorting';

type UseProjectDataParams = {
  projectId?: string;
  filters: TaskFilters;
  tableSort: TaskTableSort;
};

export function useProjectData({ projectId, filters, tableSort }: UseProjectDataParams) {
  const queryClient = useQueryClient();
  const tasksQueryKey = ['project', projectId, 'tasks', filters] as const;

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () =>
      api(`/projects/${projectId}`, { credentials: 'include' }).then((r) => r.project),
    enabled: Boolean(projectId),
  });

  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      params.set('sort', filters.sort);
      const url = `/projects/${projectId}/tasks${params.size ? `?${params.toString()}` : ''}`;
      return api(url, { credentials: 'include' }).then((r) => r.tasks as Task[]);
    },
    enabled: Boolean(projectId),
  });

  const tasks = tasksQuery.data ?? [];

  const tasksByStatus = useMemo(() => {
    return STATUS_OPTIONS.reduce<TaskByStatus>(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status);
        return acc;
      },
      { PENDING: [], IN_PROGRESS: [], COMPLETED: [] },
    );
  }, [tasks]);

  const sortedTableTasks = useMemo(
    () => sortTasksForTable(tasks, tableSort),
    [tasks, tableSort],
  );

  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: ['project', projectId, 'tasks'] });

  const createTask = useMutation({
    mutationFn: async ({ title, description, dueDate, status }: CreateTaskPayload) =>
      api(`/projects/${projectId}/tasks`, {
        method: 'POST',
        credentials: 'include',
        body: {
          title,
          description,
          dueDate: new Date(`${dueDate}T00:00:00`).toISOString(),
          status,
        },
      }),
    onSuccess: () => {
      invalidateTasks();
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskPayload }) =>
      api(`/projects/tasks/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: data,
      }),
    onSuccess: () => {
      invalidateTasks();
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: DeleteTaskPayload) =>
      api(`/projects/tasks/${taskId}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => {
      invalidateTasks();
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
      await queryClient.cancelQueries({ queryKey: ['project', projectId, 'tasks'] });
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
      invalidateTasks();
    },
  });

  return {
    projectQuery,
    tasksQuery,
    tasks,
    tasksByStatus,
    sortedTableTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
}

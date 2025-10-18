import { z } from 'zod';

export const TaskStatusValues = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TaskStatusEnum = z.enum(TaskStatusValues);

export const ProjectCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
});

export const ProjectUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const ProjectIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const TaskCreateSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
    status: TaskStatusEnum.optional(),
    assigneeId: z.string().optional(),
  }),
});

export const TaskUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: TaskStatusEnum.optional(),
    assigneeId: z.string().nullable().optional(),
  }),
});

export const TaskIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const ProjectTasksSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  query: z.object({
    status: TaskStatusEnum.optional(),
    sort: z.enum(['dueDateAsc', 'dueDateDesc']).optional(),
  }).optional(),
});

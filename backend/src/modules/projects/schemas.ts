import { z } from 'zod';

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
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assigneeId: z.string().optional(),
  }),
});

export const TaskUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
    dueDate: z.string().datetime().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assigneeId: z.string().nullable().optional(),
  }),
});

export const TaskIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const ProjectTasksSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
});

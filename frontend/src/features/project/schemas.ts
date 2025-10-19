import { z } from 'zod';
import { STATUS_OPTIONS } from './constants';

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Informe um titulo'),
  description: z.string().optional(),
  status: z.enum(STATUS_OPTIONS),
  dueDate: z.string().min(1, 'Informe a data de entrega'),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { STATUS_COLUMNS, statusDotClass, statusTextClass } from '../constants';
import { formatDateForInput } from '../utils/sorting';
import { taskFormSchema, type TaskFormValues } from '../schemas';
import { type Task, type TaskStatus } from '../types';
import { cn } from '../../../lib/utils';

type CreateTaskDialogProps = {
  defaultStatus: TaskStatus;
  open: boolean;
  saving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
};

export function CreateTaskDialog({
  defaultStatus,
  open,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: CreateTaskDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
      dueDate: formatDateForInput(new Date().toISOString()),
    },
  });

  useEffect(() => {
    form.reset({
      title: '',
      description: '',
      status: defaultStatus,
      dueDate: formatDateForInput(new Date().toISOString()),
    });
  }, [defaultStatus, form]);

  if (!open) return null;

  const statusValue = form.watch('status');

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-card-foreground">Nova tarefa</h2>
            <p className="text-xs text-muted-foreground">
              Defina os detalhes e salve para adicionar ao quadro Kanban.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="new-task-title">
              Titulo
            </label>
            <Input id="new-task-title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="new-task-description">
              Descricao
            </label>
            <Textarea id="new-task-description" rows={4} {...form.register('description')} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={statusValue}
                onValueChange={(value: TaskStatus) => form.setValue('status', value)}
              >
                <SelectTrigger className={statusTextClass(statusValue)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="new-task-due-date">
                Data de entrega
              </label>
              <Input id="new-task-due-date" type="date" {...form.register('dueDate')} />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adicionando...' : 'Adicionar tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TaskDetailsDialogProps = {
  task: Task | null;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TaskDetailsDialog({
  task,
  saving,
  deleting,
  onClose,
  onSubmit,
  onDelete,
}: TaskDetailsDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? STATUS_COLUMNS[0].value,
      dueDate: formatDateForInput(task?.dueDate ?? new Date().toISOString()),
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        dueDate: formatDateForInput(task.dueDate),
      });
    }
  }, [task, form]);

  if (!task) return null;

  const statusValue = form.watch('status') as TaskStatus;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-card-foreground">Detalhes da tarefa</h2>
            <p className="text-xs text-muted-foreground">
              Edite as informacoes e salve para atualizar. As alteracoes sao sincronizadas automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="task-title">
              Titulo
            </label>
            <Input id="task-title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="task-description">
              Descricao
            </label>
            <Textarea id="task-description" rows={4} {...form.register('description')} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={statusValue}
                onValueChange={(value: TaskStatus) => form.setValue('status', value)}
              >
                <SelectTrigger className={statusTextClass(statusValue)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="task-due-date">
                Data de entrega
              </label>
              <Input id="task-due-date" type="date" {...form.register('dueDate')} />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="destructive" onClick={onDelete} disabled={deleting}>
                {deleting ? 'Removendo...' : 'Excluir'}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

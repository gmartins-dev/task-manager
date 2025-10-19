
import { Button } from '../../../components/ui/button';

type DeleteProjectDialogProps = {
  projectName: string;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteProjectDialog({
  projectName,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-card shadow-xl">
        <div className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-card-foreground">Excluir projeto</h2>
            <p className="text-sm text-muted-foreground">
              Essa acao remove permanentemente o projeto{' '}
              <span className="font-medium text-foreground">{projectName}</span> e todas as suas tarefas.
            </p>
          </div>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? 'Excluindo...' : 'Excluir projeto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

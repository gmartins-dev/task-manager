
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { type Project } from '../types';

type EditProjectDialogProps = {
  project: Project;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: { name: string; description?: string }) => void;
};

export function EditProjectDialog({
  project,
  pending,
  errorMessage,
  onCancel,
  onSubmit,
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? '');
    setLocalError(null);
  }, [project]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError('Informe um nome para o projeto');
      return;
    }
    const trimmedDescription = description.trim();
    setLocalError(null);
    onSubmit({
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-card-foreground">Editar projeto</h2>
            <p className="text-sm text-muted-foreground">
              Atualize o nome e a descricao para manter as informacoes alinhadas com o time.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="edit-project-name">
              Nome
            </label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="edit-project-description">
              Descricao
            </label>
            <Textarea
              id="edit-project-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={pending}
            />
          </div>
          {localError && <p className="text-sm text-destructive">{localError}</p>}
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';

type CreateProjectCardProps = {
  name: string;
  description: string;
  error: string | null;
  submitting: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
};

export function CreateProjectCard({
  name,
  description,
  error,
  submitting,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: CreateProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo projeto</CardTitle>
        <CardDescription>Crie um espaco para agrupar tarefas por iniciativa ou equipe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Nome do projeto" value={name} onChange={(event) => onNameChange(event.target.value)} />
        <Textarea
          placeholder="Descricao breve (opcional)"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={onSubmit} disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Criando...' : 'Criar projeto'}
        </Button>
      </CardContent>
    </Card>
  );
}

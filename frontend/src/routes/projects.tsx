import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../util/api';
import { useAuthStore } from '../stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export function ProjectsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => api('/projects', { credentials: 'include' }).then((r) => r.projects as Project[]),
    enabled: !!token,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('O nome do projeto e obrigatorio');
      return api('/projects', {
        method: 'POST',
        credentials: 'include',
        body: { name: name.trim(), description: description.trim() || undefined },
      });
    },
    onSuccess: () => {
      setName('');
      setDescription('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: unknown) => {
      setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar o projeto');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) =>
      api(`/projects/${projectId}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToDelete(null);
      setDeleteError(null);
    },
    onError: () => {
      setDeleteError('Nao foi possivel excluir o projeto. Tente novamente.');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name: nextName, description: nextDescription }: { id: string; name: string; description?: string }) =>
      api(`/projects/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { name: nextName, description: nextDescription },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToEdit(null);
      setEditError(null);
    },
    onError: (error: unknown) => {
      setEditError(error instanceof Error ? error.message : 'Nao foi possivel atualizar o projeto');
    },
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Novo projeto</CardTitle>
          <CardDescription>Crie um espaco para agrupar tarefas por iniciativa ou equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Nome do projeto"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Textarea
            placeholder="Descricao breve (opcional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            onClick={() => createProject.mutate()}
            disabled={createProject.isPending}
            className="w-full sm:w-auto"
          >
            {createProject.isPending ? 'Criando...' : 'Criar projeto'}
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projetos</h2>
          <span className="text-sm text-muted-foreground">{data?.length ?? 0} no total</span>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando projetos...</p>}
        {isError && (
          <p className="text-sm text-destructive">Nao foi possivel carregar seus projetos. Tente novamente em instantes.</p>
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Voce ainda nao tem projetos. Crie o primeiro usando o formulario acima.
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((project) => (
            <Card
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/projects/${project.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/projects/${project.id}`);
                }
              }}
              className="group transition hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl group-hover:text-primary">{project.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar o projeto ${project.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setProjectToEdit(project);
                        setEditError(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir o projeto ${project.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setProjectToDelete(project);
                        setDeleteError(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Criado em {new Date(project.createdAt).toLocaleDateString()}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {projectToEdit && (
        <EditProjectDialog
          project={projectToEdit}
          onCancel={() => {
            setProjectToEdit(null);
            setEditError(null);
          }}
          onSubmit={(values) =>
            updateProject.mutate({ id: projectToEdit.id, name: values.name, description: values.description })
          }
          pending={updateProject.isPending}
          errorMessage={editError}
        />
      )}

      {projectToDelete && (
        <DeleteProjectDialog
          projectName={projectToDelete.name}
          onCancel={() => {
            setProjectToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => deleteProject.mutate(projectToDelete.id)}
          pending={deleteProject.isPending}
          errorMessage={deleteError}
        />
      )}
    </div>
  );
}

type DeleteProjectDialogProps = {
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  errorMessage: string | null;
};

type EditProjectDialogProps = {
  project: Project;
  onCancel: () => void;
  onSubmit: (values: { name: string; description?: string }) => void;
  pending: boolean;
  errorMessage: string | null;
};

function EditProjectDialog({ project, onCancel, onSubmit, pending, errorMessage }: EditProjectDialogProps) {
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

function DeleteProjectDialog({
  projectName,
  onCancel,
  onConfirm,
  pending,
  errorMessage,
}: DeleteProjectDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-card shadow-xl">
        <div className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-card-foreground">Excluir projeto</h2>
            <p className="text-sm text-muted-foreground">
              Essa acao remove permanentemente o projeto <span className="font-medium text-foreground">{projectName}</span>{' '}
              e todas as suas tarefas.
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

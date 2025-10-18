import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <Card className="transition hover:border-primary/60 group-focus-visible:border-primary/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary">
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Criado em {new Date(project.createdAt).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

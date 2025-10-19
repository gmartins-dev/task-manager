import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { CreateProjectCard } from './components/create-project-card';
import { ProjectsGrid } from './components/projects-grid';
import { DeleteProjectDialog } from './components/delete-project-dialog';
import { EditProjectDialog } from './components/edit-project-dialog';
import { useProjects } from './hooks/use-projects';
import { type Project } from './types';

export function ProjectsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { query, createProject, updateProject, deleteProject } = useProjects(Boolean(token));

  const handleCreateProject = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('O nome do projeto e obrigatorio');
      return;
    }

    createProject
      .mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      })
      .then(() => {
        setName('');
        setDescription('');
        setFormError(null);
      })
      .catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar o projeto');
      });
  };

  const handleUpdateProject = (values: { name: string; description?: string }) => {
    if (!projectToEdit) return;
    updateProject
      .mutateAsync({ id: projectToEdit.id, ...values })
      .then(() => {
        setProjectToEdit(null);
        setEditError(null);
      })
      .catch((error: unknown) => {
        setEditError(
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o projeto',
        );
      });
  };

  const handleDeleteProject = () => {
    if (!projectToDelete) return;
    deleteProject
      .mutateAsync(projectToDelete.id)
      .then(() => {
        setProjectToDelete(null);
        setDeleteError(null);
      })
      .catch(() => {
        setDeleteError('Nao foi possivel excluir o projeto. Tente novamente.');
      });
  };

  const projects = query.data ?? [];

  return (
    <div className="space-y-8">
      <CreateProjectCard
        name={name}
        description={description}
        error={formError}
        submitting={createProject.isPending}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSubmit={handleCreateProject}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projetos</h2>
          <span className="text-sm text-muted-foreground">{projects.length} no total</span>
        </div>

        {query.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando projetos...</p>
        )}

        {query.isError && (
          <p className="text-sm text-destructive">
            Nao foi possivel carregar seus projetos. Tente novamente em instantes.
          </p>
        )}

        {!query.isLoading && !query.isError && projects.length === 0 && (
          <div className="rounded-lg border bg-card">
            <p className="py-8 text-center text-sm text-muted-foreground">
              Voce ainda nao tem projetos. Crie o primeiro usando o formulario acima.
            </p>
          </div>
        )}

        {projects.length > 0 && (
          <ProjectsGrid
            projects={projects}
            onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
            onEditProject={(project) => {
              setProjectToEdit(project);
              setEditError(null);
            }}
            onDeleteProject={(project) => {
              setProjectToDelete(project);
              setDeleteError(null);
            }}
          />
        )}
      </section>

      {projectToEdit && (
        <EditProjectDialog
          project={projectToEdit}
          pending={updateProject.isPending}
          errorMessage={editError}
          onCancel={() => {
            setProjectToEdit(null);
            setEditError(null);
          }}
          onSubmit={handleUpdateProject}
        />
      )}

      {projectToDelete && (
        <DeleteProjectDialog
          projectName={projectToDelete.name}
          pending={deleteProject.isPending}
          errorMessage={deleteError}
          onCancel={() => {
            setProjectToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  );
}

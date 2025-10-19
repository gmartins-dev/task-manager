
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { type Project } from '../types';

type ProjectsGridProps = {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
};

export function ProjectsGrid({
  projects,
  onOpenProject,
  onEditProject,
  onDeleteProject,
}: ProjectsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Card
          key={project.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpenProject(project.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpenProject(project.id);
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
                    onEditProject(project);
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
                    onDeleteProject(project);
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
  );
}

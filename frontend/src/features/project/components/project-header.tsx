import { type Project } from '../types';

type ProjectHeaderProps = {
  project: Project;
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
      {project.description && (
        <p className="max-w-3xl text-sm text-muted-foreground">{project.description}</p>
      )}
    </div>
  );
}

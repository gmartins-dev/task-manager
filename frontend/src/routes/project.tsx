import { useParams } from 'react-router-dom';
import { ProjectPage as ProjectFeaturePage } from '../features/project/project-page';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <p className="text-sm text-destructive">Projeto nao encontrado.</p>;
  }
  return <ProjectFeaturePage projectId={id} />;
}

export default ProjectPage;

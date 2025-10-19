
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../util/api';
import { type Project } from '../types';

export function useProjects(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects'],
    queryFn: async () =>
      api('/projects', { credentials: 'include' }).then((r) => r.projects as Project[]),
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) =>
      api('/projects', {
        method: 'POST',
        credentials: 'include',
        body: { name, description },
      }),
    onSuccess: () => invalidate(),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) =>
      api(`/projects/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { name, description },
      }),
    onSuccess: () => invalidate(),
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) =>
      api(`/projects/${projectId}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => invalidate(),
  });

  return {
    query,
    createProject,
    updateProject,
    deleteProject,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../util/api';
import { useAuthStore } from '../stores/auth';
import { useState } from 'react';

export function ProjectsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => api('/projects', { credentials: 'include', method: 'GET' }).then(r => r.projects),
    enabled: !!token,
  });
  const create = useMutation({
    mutationFn: async () => api('/projects', { method: 'POST', credentials: 'include', body: { name } }),
    onSuccess: () => { setName(''); qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading projects</p>;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border p-2 rounded flex-1" placeholder="New project name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-black text-white px-3 rounded" onClick={() => create.mutate()} disabled={!name}>Add</button>
      </div>
      <ul className="space-y-2">
        {data?.map((p: any) => (
          <li key={p.id} className="border p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
            <Link to={`/projects/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}


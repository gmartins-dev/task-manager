import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../util/api';
import { useState } from 'react';

export function ProjectPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['project', id], queryFn: async () => api(`/projects/${id}`, { credentials: 'include' }).then(r => r.project) });
  const [title, setTitle] = useState('');
  const createTask = useMutation({
    mutationFn: async () => api(`/projects/${id}/tasks`, { method: 'POST', credentials: 'include', body: { title } }),
    onSuccess: () => { setTitle(''); qc.invalidateQueries({ queryKey: ['project', id] }); },
  });
  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{data.name}</h1>
      <div className="flex gap-2">
        <input className="border p-2 rounded flex-1" placeholder="New task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="bg-black text-white px-3 rounded" onClick={() => createTask.mutate()} disabled={!title}>Add</button>
      </div>
      <ul className="space-y-2">
        {data.tasks?.map((t: any) => (
          <li key={t.id} className="border p-3 rounded flex items-center justify-between">
            <span>{t.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


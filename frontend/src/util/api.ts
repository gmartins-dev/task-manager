type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
import { useAuthStore } from '../stores/auth';

export async function api(
  path: string,
  options: { method?: HttpMethod; body?: any; credentials?: RequestCredentials } = {},
) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const state = useAuthStore.getState();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (state.accessToken) headers['Authorization'] = `Bearer ${state.accessToken}`;

  const doFetch = async () =>
    fetch(baseURL + path, {
      method: options.method || 'GET',
      headers,
      credentials: options.credentials,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

  let res = await doFetch();
  // Try refresh on 401 and retry once
  if (res.status === 401 && options.credentials === 'include') {
    try {
      const refreshRes = await fetch(baseURL + '/auth/refresh', { method: 'POST', credentials: 'include' });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok && refreshData?.accessToken) {
        useAuthStore.setState({ accessToken: refreshData.accessToken });
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        res = await doFetch();
      }
    } catch {
      // ignore
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}

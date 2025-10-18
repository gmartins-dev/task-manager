import { getAccessToken, setAccessToken } from './auth-token';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiOptions = {
  method?: HttpMethod;
  body?: unknown;
  credentials?: RequestCredentials;
};

export async function api(path: string, options: ApiOptions = {}) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isRefreshCall = path === '/auth/refresh';

  const doFetch = async () =>
    fetch(baseURL + path, {
      method: options.method ?? 'GET',
      headers,
      credentials: options.credentials,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

  let res = await doFetch();

  if (!isRefreshCall && res.status === 401 && options.credentials === 'include') {
    try {
      const refreshRes = await fetch(baseURL + '/auth/refresh', { method: 'POST', credentials: 'include' });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok && refreshData?.accessToken) {
        setAccessToken(refreshData.accessToken);
        headers.Authorization = `Bearer ${refreshData.accessToken}`;
        res = await doFetch();
      }
    } catch {
      // ignore network errors here; fallback to throwing below
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? 'Falha na requisicao');
  return data;
}

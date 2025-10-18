import { create } from 'zustand';
import { api } from '../util/api';
import { getAccessToken, setAccessToken, subscribeToAccessToken } from '../util/auth-token';

type User = { id: string; email: string; name: string };

type AuthState = {
  user?: User;
  accessToken?: string;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => {
  subscribeToAccessToken((token) => set((state) => ({ ...state, accessToken: token })));

  return {
    user: undefined,
    accessToken: getAccessToken(),
    hydrated: false,
    async login(email, password) {
      const res = await api('/auth/login', { method: 'POST', body: { email, password }, credentials: 'include' });
      setAccessToken(res.accessToken);
      set({ user: res.user, accessToken: res.accessToken, hydrated: true });
    },
    async register(name, email, password) {
      const res = await api('/auth/register', { method: 'POST', body: { name, email, password }, credentials: 'include' });
      setAccessToken(res.accessToken);
      set({ user: res.user, accessToken: res.accessToken, hydrated: true });
    },
    async refresh() {
      try {
        const res = await api('/auth/refresh', { method: 'POST', credentials: 'include' });
        setAccessToken(res.accessToken);
        set((state) => ({ ...state, accessToken: res.accessToken, hydrated: true }));
      } catch {
        setAccessToken(undefined);
        set({ user: undefined, accessToken: undefined, hydrated: true });
      }
    },
    async logout() {
      try {
        await api('/auth/logout', { method: 'POST', credentials: 'include' });
      } finally {
        setAccessToken(undefined);
        set({ user: undefined, accessToken: undefined, hydrated: true });
      }
    },
  };
});

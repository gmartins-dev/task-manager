import { create } from 'zustand';
import { api } from '../util/api';

type User = { id: string; email: string; name: string };

type AuthState = {
  user?: User;
  accessToken?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  accessToken: undefined,
  async login(email, password) {
    const res = await api('/auth/login', { method: 'POST', body: { email, password }, credentials: 'include' });
    set({ user: res.user, accessToken: res.accessToken });
  },
  async register(name, email, password) {
    const res = await api('/auth/register', { method: 'POST', body: { name, email, password }, credentials: 'include' });
    set({ user: res.user, accessToken: res.accessToken });
  },
  async refresh() {
    const res = await api('/auth/refresh', { method: 'POST', credentials: 'include' });
    set((s) => ({ ...s, accessToken: res.accessToken }));
  },
  async logout() {
    await api('/auth/logout', { method: 'POST', credentials: 'include' });
    set({ user: undefined, accessToken: undefined });
  }
}));


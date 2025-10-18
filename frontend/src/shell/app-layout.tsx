import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <Link to="/projects" className="font-semibold">Task Manager</Link>
        <button className="text-sm underline" onClick={logout}>Logout</button>
      </header>
      <main className="p-4 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}


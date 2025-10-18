import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { Button } from '../components/ui/button';

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/projects" className="text-lg font-semibold">
            Task Manager
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {user && <span className="hidden sm:inline">Hello, {user.name}</span>}
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

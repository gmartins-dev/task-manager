import { Outlet, Link } from 'react-router-dom';
import { ClipboardList, CircleUserRound } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/theme-toggle';

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-[#0F172A] text-slate-100 shadow-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/projects" className="flex items-center gap-1 text-lg font-semibold tracking-wide">
            <ClipboardList className="h-6 w-6 text-white" aria-hidden />
            <span className="text-xl font-semibold text-white">OrganizAI</span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-2 py-1">
              <CircleUserRound className="h-5 w-5 text-white" aria-hidden />
              {user && <span className="hidden sm:inline font-medium text-white">{user.name}</span>}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="border border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Sair
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

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './shell/app-layout';
import { LoginPage } from './routes/login';
import { RegisterPage } from './routes/register';
import { ProjectsPage } from './routes/projects';
import { ProjectPage } from './routes/project';
import { useAuthStore } from './stores/auth';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/projects" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:id', element: <ProjectPage /> },
    ],
  },
]);


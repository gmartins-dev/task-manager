import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const schema = z.object({
  email: z.string().email('Informe um e-mail valido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: Form) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      navigate('/projects');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Nao foi possivel entrar');
    }
  };

  return (
    <div className="mx-auto w-full max-w-md py-12">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>Entre para gerenciar seus projetos e tarefas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Nao tem uma conta?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Crie agora
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

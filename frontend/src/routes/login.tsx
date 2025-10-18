import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/auth';
import { Link, useNavigate } from 'react-router-dom';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const onSubmit = async (values: Form) => {
    await login(values.email, values.password);
    navigate('/projects');
  };
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input className="w-full border p-2 rounded" placeholder="Email" type="email" {...register('email')} />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <input className="w-full border p-2 rounded" placeholder="Password" type="password" {...register('password')} />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>
        <button disabled={isSubmitting} className="w-full bg-black text-white py-2 rounded">Login</button>
      </form>
      <p className="mt-4 text-sm">No account? <Link to="/register" className="underline">Register</Link></p>
    </div>
  );
}


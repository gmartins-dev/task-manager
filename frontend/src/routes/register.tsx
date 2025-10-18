import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/auth';
import { Link, useNavigate } from 'react-router-dom';

const schema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) });
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: reg, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const registerUser = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const onSubmit = async (values: Form) => {
    await registerUser(values.name, values.email, values.password);
    navigate('/projects');
  };
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input className="w-full border p-2 rounded" placeholder="Name" {...reg('name')} />
          {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <input className="w-full border p-2 rounded" placeholder="Email" type="email" {...reg('email')} />
          {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <input className="w-full border p-2 rounded" placeholder="Password" type="password" {...reg('password')} />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>
        <button disabled={isSubmitting} className="w-full bg-black text-white py-2 rounded">Create Account</button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="underline">Login</Link></p>
    </div>
  );
}


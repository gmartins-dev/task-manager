import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = (() => {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('[env] Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
})();

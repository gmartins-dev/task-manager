import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { authRouter } from './modules/auth/router';
import { projectsRouter } from './modules/projects/router';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');
  const allowedOrigins = env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin) => Boolean(origin));
  const allowAllOrigins = allowedOrigins?.includes('*');
  const corsOrigin = allowAllOrigins || !allowedOrigins || allowedOrigins.length === 0 ? true : allowedOrigins;
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRouter);
  app.use('/projects', projectsRouter);

  app.use(errorHandler);
  return app;
};


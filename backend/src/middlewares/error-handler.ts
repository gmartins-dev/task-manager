import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = err?.status || 500;
  const message = err?.message || 'Internal Server Error';
  const details = err?.details;
  res.status(status).json({ error: { message, details } });
};


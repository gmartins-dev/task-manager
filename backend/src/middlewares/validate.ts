import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      return res.status(400).json({ error: { message: 'Falha na validacao dos dados', details: result.error.flatten() } });
    }
    // Replace with parsed values to ensure types
    const { body, params, query } = result.data as any;
    if (body !== undefined) req.body = body;
    if (params !== undefined) req.params = params;
    if (query !== undefined) req.query = query;
    next();
  };

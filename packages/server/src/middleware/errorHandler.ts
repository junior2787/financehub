import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public details?: unknown) { super(message); Object.setPrototypeOf(this, AppError.prototype); }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);
  if (err instanceof ZodError) { res.status(400).json({ error: 'Dados inválidos', details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })) }); return; }
  if (err instanceof AppError) { res.status(err.statusCode).json({ error: err.message, details: err.details }); return; }
  res.status(500).json({ error: 'Erro interno do servidor' });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
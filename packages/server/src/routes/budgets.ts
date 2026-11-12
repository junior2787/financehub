import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { budgetSchema, idParamSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
}

const budgets = new Map<string, Budget[]>();

function getUserBudgets(userId: string): Budget[] {
  return budgets.get(userId) || [];
}

export const budgetsRouter = Router();

budgetsRouter.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const bs = getUserBudgets(req.user!.id);
  res.json({ budgets: bs });
}));

budgetsRouter.post('/', validate(budgetSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { categoryId, amount, period, startDate, endDate } = req.body;
  const userBudgets = getUserBudgets(req.user!.id);
  const budget: Budget = { id: uuidv4(), userId: req.user!.id, categoryId, amount, period, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, createdAt: new Date() };
  userBudgets.push(budget);
  budgets.set(req.user!.id, userBudgets);
  res.status(201).json({ budget });
}));

budgetsRouter.put('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userBudgets = getUserBudgets(req.user!.id);
  const idx = userBudgets.findIndex(b => b.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Orçamento não encontrado');
  const { categoryId, amount, period, startDate, endDate } = req.body;
  userBudgets[idx] = { ...userBudgets[idx], categoryId, amount, period, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null };
  res.json({ budget: userBudgets[idx] });
}));

budgetsRouter.delete('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userBudgets = getUserBudgets(req.user!.id);
  const idx = userBudgets.findIndex(b => b.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Orçamento não encontrado');
  userBudgets.splice(idx, 1);
  res.status(204).send();
}));
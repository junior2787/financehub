import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { accountSchema, idParamSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH' | 'OTHER';
  currency: string;
  balance: number;
  color: string;
  institution?: string;
  createdAt: Date;
}

const accounts = new Map<string, Account[]>();

function getUserAccounts(userId: string): Account[] {
  return accounts.get(userId) || [];
}

export const accountsRouter = Router();

accountsRouter.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const accs = getUserAccounts(req.user!.id);
  res.json({ accounts: accs });
}));

accountsRouter.get('/summary', asyncHandler(async (req: AuthRequest, res) => {
  const accs = getUserAccounts(req.user!.id);
  const totalBalance = accs.reduce((sum, a) => sum + a.balance, 0);
  const byType = accs.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.balance;
    return acc;
  }, {} as Record<string, number>);
  res.json({ totalBalance, byType, count: accs.length });
}));

accountsRouter.post('/', validate(accountSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { name, type, currency, balance, color, institution } = req.body;
  const userAccs = getUserAccounts(req.user!.id);
  const acc: Account = { id: uuidv4(), userId: req.user!.id, name, type, currency: currency || 'BRL', balance: balance || 0, color, institution, createdAt: new Date() };
  userAccs.push(acc);
  accounts.set(req.user!.id, userAccs);
  res.status(201).json({ account: acc });
}));

accountsRouter.put('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userAccs = getUserAccounts(req.user!.id);
  const idx = userAccs.findIndex(a => a.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Conta não encontrada');
  const { name, type, currency, balance, color, institution } = req.body;
  userAccs[idx] = { ...userAccs[idx], name, type, currency, balance: balance ?? userAccs[idx].balance, color, institution };
  res.json({ account: userAccs[idx] });
}));

accountsRouter.delete('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userAccs = getUserAccounts(req.user!.id);
  const idx = userAccs.findIndex(a => a.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Conta não encontrada');
  userAccs.splice(idx, 1);
  res.status(204).send();
}));
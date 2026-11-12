import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { transactionSchema, idParamSchema, queryTransactionsSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

interface Transaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description: string;
  categoryId: string | null;
  accountId: string;
  destinationAccountId: string | null;
  date: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  color: string;
  institution?: string;
}

const transactions = new Map<string, Transaction[]>();
const accounts = new Map<string, Account>();

function getUserTransactions(userId: string): Transaction[] {
  return transactions.get(userId) || [];
}

function getUserAccounts(userId: string): Account[] {
  return Array.from(accounts.values()).filter(a => a.userId === userId);
}

export const transactionsRouter = Router();

transactionsRouter.get('/', validate(queryTransactionsSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { type, categoryId, accountId, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;
  let txs = getUserTransactions(req.user!.id);

  if (type) txs = txs.filter(t => t.type === type);
  if (categoryId) txs = txs.filter(t => t.categoryId === categoryId);
  if (accountId) txs = txs.filter(t => t.accountId === accountId || t.destinationAccountId === accountId);
  if (startDate) txs = txs.filter(t => t.date >= new Date(startDate as string));
  if (endDate) txs = txs.filter(t => t.date <= new Date(endDate as string));

  txs.sort((a, b) => {
    const aVal = a[sortBy as keyof Transaction];
    const bVal = b[sortBy as keyof Transaction];
    const cmp = aVal! < bVal! ? -1 : aVal! > bVal! ? 1 : 0;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const total = txs.length;
  const paginated = txs.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));
  res.json({ transactions: paginated, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
}));

transactionsRouter.get('/summary', asyncHandler(async (req: AuthRequest, res) => {
  const txs = getUserTransactions(req.user!.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxs = txs.filter(t => t.date >= monthStart);

  const income = monthTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  const byCategory: Record<string, { amount: number; count: number }> = {};
  for (const t of monthTxs.filter(t => t.type === 'EXPENSE')) {
    const key = t.categoryId || 'sem-categoria';
    byCategory[key] = { amount: (byCategory[key]?.amount || 0) + t.amount, count: (byCategory[key]?.count || 0) + 1 };
  }

  res.json({ income, expense, balance, byCategory, transactionCount: monthTxs.length });
}));

transactionsRouter.post('/', validate(transactionSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { type, amount, description, categoryId, accountId, destinationAccountId, date, tags } = req.body;
  const userId = req.user!.id;

  const userAccounts = getUserAccounts(userId);
  const sourceAccount = userAccounts.find(a => a.id === accountId);
  if (!sourceAccount) throw new AppError(404, 'Conta de origem não encontrada');

  let destAccount: Account | undefined;
  if (type === 'TRANSFER') {
    if (!destinationAccountId) throw new AppError(400, 'Conta de destino obrigatória para transferência');
    destAccount = userAccounts.find(a => a.id === destinationAccountId);
    if (!destAccount) throw new AppError(404, 'Conta de destino não encontrada');
  }

  const tx: Transaction = {
    id: uuidv4(), userId, type, amount, description,
    categoryId: categoryId || null, accountId, destinationAccountId: destinationAccountId || null,
    date: new Date(date), tags: tags || [], createdAt: new Date(), updatedAt: new Date(),
  };

  // Update balances
  if (type === 'INCOME') sourceAccount.balance += amount;
  else if (type === 'EXPENSE') sourceAccount.balance -= amount;
  else if (type === 'TRANSFER') {
    sourceAccount.balance -= amount;
    if (destAccount) destAccount.balance += amount;
  }

  const userTxs = getUserTransactions(userId);
  userTxs.push(tx);
  transactions.set(userId, userTxs);

  res.status(201).json({ transaction: tx, account: sourceAccount });
}));

transactionsRouter.get('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const txs = getUserTransactions(req.user!.id);
  const tx = txs.find(t => t.id === req.params.id);
  if (!tx) throw new AppError(404, 'Transação não encontrada');
  res.json({ transaction: tx });
}));

transactionsRouter.put('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const txs = getUserTransactions(req.user!.id);
  const idx = txs.findIndex(t => t.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Transação não encontrada');

  const oldTx = txs[idx];
  const { type, amount, description, categoryId, accountId, destinationAccountId, date, tags } = req.body;

  // Revert old balance
  const userAccounts = getUserAccounts(req.user!.id);
  const oldAccount = userAccounts.find(a => a.id === oldTx.accountId);
  const oldDestAccount = oldTx.destinationAccountId ? userAccounts.find(a => a.id === oldTx.destinationAccountId) : undefined;

  if (oldTx.type === 'INCOME' && oldAccount) oldAccount.balance -= oldTx.amount;
  else if (oldTx.type === 'EXPENSE' && oldAccount) oldAccount.balance += oldTx.amount;
  else if (oldTx.type === 'TRANSFER') {
    if (oldAccount) oldAccount.balance += oldTx.amount;
    if (oldDestAccount) oldDestAccount.balance -= oldTx.amount;
  }

  // Apply new
  const newAccount = userAccounts.find(a => a.id === accountId);
  const newDestAccount = destinationAccountId ? userAccounts.find(a => a.id === destinationAccountId) : undefined;

  if (type === 'INCOME' && newAccount) newAccount.balance += amount;
  else if (type === 'EXPENSE' && newAccount) newAccount.balance -= amount;
  else if (type === 'TRANSFER') {
    if (newAccount) newAccount.balance -= amount;
    if (newDestAccount) newDestAccount.balance += amount;
  }

  txs[idx] = { ...oldTx, type, amount, description, categoryId: categoryId || null, accountId, destinationAccountId: destinationAccountId || null, date: new Date(date), tags: tags || [], updatedAt: new Date() };
  res.json({ transaction: txs[idx], account: newAccount });
}));

transactionsRouter.delete('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const txs = getUserTransactions(req.user!.id);
  const idx = txs.findIndex(t => t.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Transação não encontrada');

  const tx = txs[idx];
  const userAccounts = getUserAccounts(req.user!.id);
  const account = userAccounts.find(a => a.id === tx.accountId);
  const destAccount = tx.destinationAccountId ? userAccounts.find(a => a.id === tx.destinationAccountId) : undefined;

  if (tx.type === 'INCOME' && account) account.balance -= tx.amount;
  else if (tx.type === 'EXPENSE' && account) account.balance += tx.amount;
  else if (tx.type === 'TRANSFER') {
    if (account) account.balance += tx.amount;
    if (destAccount) destAccount.balance -= tx.amount;
  }

  txs.splice(idx, 1);
  res.status(204).send();
}));
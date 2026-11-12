import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getUserTransactions } from './transactions.js';
import { getUserCategories } from './categories.js';
import { getUserAccounts } from './accounts.js';

export const reportsRouter = Router();

reportsRouter.get('/monthly', asyncHandler(async (req: AuthRequest, res) => {
  const { year, month } = req.query;
  const now = new Date();
  const targetYear = year ? parseInt(year as string) : now.getFullYear();
  const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();

  const txs = getUserTransactions(req.user!.id);
  const cats = getUserCategories(req.user!.id);
  const accounts = getUserAccounts(req.user!.id);

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const monthTxs = txs.filter(t => t.date >= monthStart && t.date <= monthEnd);

  const income = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, { amount: number; count: number; color: string; name: string }> = {};
  for (const t of monthTxs.filter(t => t.type === 'EXPENSE')) {
    const cat = cats.find(c => c.id === t.categoryId);
    const key = t.categoryId || 'sem-categoria';
    if (!byCategory[key]) byCategory[key] = { amount: 0, count: 0, color: cat?.color || '#6b7280', name: cat?.name || 'Sem categoria' };
    byCategory[key].amount += t.amount;
    byCategory[key].count += 1;
  }

  const byAccount: Record<string, { income: number; expense: number; balance: number; color: string; name: string }> = {};
  for (const t of monthTxs) {
    const acc = accounts.find(a => a.id === t.accountId);
    if (!byAccount[t.accountId]) byAccount[t.accountId] = { income: 0, expense: 0, balance: 0, color: acc?.color || '#6b7280', name: acc?.name || 'Desconhecida' };
    if (t.type === 'INCOME') byAccount[t.accountId].income += t.amount;
    else if (t.type === 'EXPENSE') byAccount[t.accountId].expense += t.amount;
    byAccount[t.accountId].balance = byAccount[t.accountId].income - byAccount[t.accountId].expense;
  }

  // Daily breakdown
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = new Date(targetYear, targetMonth, i + 1);
    const dayTxs = monthTxs.filter(t => t.date.toDateString() === day.toDateString());
    return {
      date: day.toISOString().split('T')[0],
      income: dayTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
      expense: dayTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    };
  });

  res.json({
    period: { year: targetYear, month: targetMonth + 1 },
    summary: { income, expense, balance: income - expense, transactionCount: monthTxs.length },
    byCategory: Object.entries(byCategory).map(([id, data]) => ({ categoryId: id, ...data })),
    byAccount: Object.entries(byAccount).map(([id, data]) => ({ accountId: id, ...data })),
    daily,
  });
}));

reportsRouter.get('/yearly', asyncHandler(async (req: AuthRequest, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
  const txs = getUserTransactions(req.user!.id);
  const cats = getUserCategories(req.user!.id);

  const yearTxs = txs.filter(t => t.date.getFullYear() === targetYear);

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(targetYear, i, 1);
    const monthEnd = new Date(targetYear, i + 1, 0, 23, 59, 59);
    const monthTxs = yearTxs.filter(t => t.date >= monthStart && t.date <= monthEnd);
    const income = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return { month: i + 1, income, expense, balance: income - expense };
  });

  res.json({ year: targetYear, monthly, totalIncome: monthly.reduce((s, m) => s + m.income, 0), totalExpense: monthly.reduce((s, m) => s + m.expense, 0) });
}));

reportsRouter.get('/categories', asyncHandler(async (req: AuthRequest, res) => {
  const { startDate, endDate, type } = req.query;
  const txs = getUserTransactions(req.user!.id);
  const cats = getUserCategories(req.user!.id);

  let filtered = txs;
  if (startDate) filtered = filtered.filter(t => t.date >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(t => t.date <= new Date(endDate as string));
  if (type) filtered = filtered.filter(t => t.type === type);

  const byCategory: Record<string, { amount: number; count: number; color: string; name: string; type: string }> = {};
  for (const t of filtered) {
    const cat = cats.find(c => c.id === t.categoryId);
    const key = t.categoryId || 'sem-categoria';
    if (!byCategory[key]) byCategory[key] = { amount: 0, count: 0, color: cat?.color || '#6b7280', name: cat?.name || 'Sem categoria', type: cat?.type || 'EXPENSE' };
    byCategory[key].amount += t.amount;
    byCategory[key].count += 1;
  }

  res.json({ categories: Object.entries(byCategory).map(([id, data]) => ({ categoryId: id, ...data })).sort((a, b) => b.amount - a.amount) });
}));

reportsRouter.get('/cashflow', asyncHandler(async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const txs = getUserTransactions(req.user!.id);

  let filtered = txs;
  if (startDate) filtered = filtered.filter(t => t.date >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(t => t.date <= new Date(endDate as string));

  const byDate: Record<string, { income: number; expense: number }> = {};
  for (const t of filtered.sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const key = t.date.toISOString().split('T')[0];
    if (!byDate[key]) byDate[key] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') byDate[key].income += t.amount;
    else if (t.type === 'EXPENSE') byDate[key].expense += t.amount;
  }

  let runningBalance = 0;
  const cashflow = Object.entries(byDate).map(([date, data]) => {
    runningBalance += data.income - data.expense;
    return { date, ...data, balance: runningBalance };
  });

  res.json({ cashflow });
}));
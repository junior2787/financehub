import { z } from 'zod';

export const registerSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2) }) });
export const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1) }) });

export const transactionSchema = z.object({
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().positive(),
    description: z.string().min(1).max(200),
    categoryId: z.string().uuid().nullable(),
    accountId: z.string().uuid(),
    destinationAccountId: z.string().uuid().nullable(),
    date: z.string().datetime(),
    tags: z.array(z.string()).default([]),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['INCOME', 'EXPENSE']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
    icon: z.string().default('wallet'),
    parentId: z.string().uuid().nullable(),
  }),
});

export const accountSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CASH', 'OTHER']),
    currency: z.string().length(3).default('BRL'),
    balance: z.number().default(0),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10b981'),
    institution: z.string().optional(),
  }),
});

export const budgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    amount: z.number().positive(),
    period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().nullable(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
export const queryTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    categoryId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});
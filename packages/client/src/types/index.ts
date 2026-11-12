export interface User { id: string; email: string; name: string; }
export interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; isLoading: boolean; login: (email: string, password: string) => Promise<void>; register: (email: string, password: string, name: string) => Promise<void>; logout: () => void; checkAuth: () => Promise<void>; }

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'CASH' | 'OTHER';
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Transaction {
  id: string; userId: string; type: TransactionType; amount: number; description: string;
  categoryId: string | null; accountId: string; destinationAccountId: string | null;
  date: string; tags: string[]; createdAt: string; updatedAt: string;
  category?: Category; account?: Account;
}
export interface Category { id: string; userId: string; name: string; type: 'INCOME' | 'EXPENSE'; color: string; icon: string; parentId: string | null; }
export interface Account { id: string; userId: string; name: string; type: AccountType; currency: string; balance: number; color: string; institution?: string; }
export interface Budget { id: string; userId: string; categoryId: string; amount: number; period: BudgetPeriod; startDate: string; endDate: string | null; category?: Category; }

export interface MonthlyReport {
  period: { year: number; month: number };
  summary: { income: number; expense: number; balance: number; transactionCount: number };
  byCategory: { categoryId: string; amount: number; count: number; color: string; name: string; type: string }[];
  byAccount: { accountId: string; income: number; expense: number; balance: number; color: string; name: string }[];
  daily: { date: string; income: number; expense: number }[];
}
export interface YearlyReport { year: number; monthly: { month: number; income: number; expense: number; balance: number }[]; totalIncome: number; totalExpense: number; }
export interface CategoryReport { categories: { categoryId: string; amount: number; count: number; color: string; name: string; type: string }[]; }
export interface CashflowReport { cashflow: { date: string; income: number; expense: number; balance: number }[]; }
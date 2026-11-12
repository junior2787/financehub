import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { transactionsApi, categoriesApi, accountsApi, budgetsApi, reportsApi } from '../lib/api';
import { Transaction, Category, Account, Budget, MonthlyReport, YearlyReport, CategoryReport, CashflowReport } from '../types';

interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  monthlyReport: MonthlyReport | null;
  yearlyReport: YearlyReport | null;
  categoryReport: CategoryReport | null;
  cashflowReport: CashflowReport | null;
  isLoading: boolean;
  fetchAll: () => Promise<void>;
  fetchTransactions: (params?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchReports: (year?: number, month?: number) => Promise<void>;
  createTransaction: (data: any) => Promise<Transaction>;
  updateTransaction: (id: string, data: any) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  createCategory: (data: any) => Promise<Category>;
  createAccount: (data: any) => Promise<Account>;
  createBudget: (data: any) => Promise<Budget>;
}

const FinanceContext = createContext<FinanceState | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null);
  const [cashflowReport, setCashflowReport] = useState<CashflowReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async (params?: any) => {
    const { data } = await transactionsApi.list(params);
    if (!params || params.page === 1) setTransactions(data.transactions);
    else setTransactions(prev => [...prev, ...data.transactions]);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await categoriesApi.list();
    setCategories(data.categories);
  }, []);

  const fetchAccounts = useCallback(async () => {
    const { data } = await accountsApi.list();
    setAccounts(data.accounts);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data } = await budgetsApi.list();
    setBudgets(data.budgets);
  }, []);

  const fetchReports = useCallback(async (year?: number, month?: number) => {
    const [monthly, yearly, cats, cashflow] = await Promise.all([
      reportsApi.monthly(year, month),
      reportsApi.yearly(year),
      reportsApi.categories({ year, month }),
      reportsApi.cashflow({ year, month }),
    ]);
    setMonthlyReport(monthly.data);
    setYearlyReport(yearly.data);
    setCategoryReport(cats.data);
    setCashflowReport(cashflow.data);
  }, []);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTransactions(), fetchCategories(), fetchAccounts(), fetchBudgets(), fetchReports()]);
    setIsLoading(false);
  }, [fetchTransactions, fetchCategories, fetchAccounts, fetchBudgets, fetchReports]);

  const createTransaction = async (data: any) => {
    const { data: res } = await transactionsApi.create(data);
    setTransactions(prev => [res.transaction, ...prev]);
    if (res.account) setAccounts(prev => prev.map(a => a.id === res.account.id ? res.account : a));
    await fetchReports();
    return res.transaction;
  };

  const updateTransaction = async (id: string, data: any) => {
    const { data: res } = await transactionsApi.update(id, data);
    setTransactions(prev => prev.map(t => t.id === id ? res.transaction : t));
    if (res.account) setAccounts(prev => prev.map(a => a.id === res.account.id ? res.account : a));
    await fetchReports();
    return res.transaction;
  };

  const deleteTransaction = async (id: string) => {
    await transactionsApi.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    await fetchReports();
  };

  const createCategory = async (data: any) => {
    const { data: res } = await categoriesApi.create(data);
    setCategories(prev => [...prev, res.category]);
    return res.category;
  };

  const createAccount = async (data: any) => {
    const { data: res } = await accountsApi.create(data);
    setAccounts(prev => [...prev, res.account]);
    return res.account;
  };

  const createBudget = async (data: any) => {
    const { data: res } = await budgetsApi.create(data);
    setBudgets(prev => [...prev, res.budget]);
    return res.budget;
  };

  useEffect(() => { if (isAuthenticated) fetchAll(); }, [isAuthenticated, fetchAll]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, budgets,
      monthlyReport, yearlyReport, categoryReport, cashflowReport,
      isLoading, fetchAll, fetchTransactions, fetchCategories, fetchAccounts, fetchBudgets, fetchReports,
      createTransaction, updateTransaction, deleteTransaction,
      createCategory, createAccount, createBudget,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const c = useContext(FinanceContext);
  if (!c) throw new Error('useFinance must be used within FinanceProvider');
  return c;
};
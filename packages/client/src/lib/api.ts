import axios from 'axios';

export const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((r) => r, (err) => { if (err.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; } return Promise.reject(err); });

export const authApi = { register: (d: { email: string; password: string; name: string }) => api.post('/auth/register', d), login: (d: { email: string; password: string }) => api.post('/auth/login', d), me: () => api.get('/auth/me') };

export const transactionsApi = { list: (p?: any) => api.get('/transactions', { params: p }), summary: () => api.get('/transactions/summary'), create: (d: any) => api.post('/transactions', d), get: (id: string) => api.get(`/transactions/${id}`), update: (id: string, d: any) => api.put(`/transactions/${id}`, d), delete: (id: string) => api.delete(`/transactions/${id}`) };

export const categoriesApi = { list: () => api.get('/categories'), create: (d: any) => api.post('/categories', d), update: (id: string, d: any) => api.put(`/categories/${id}`, d), delete: (id: string) => api.delete(`/categories/${id}`) };

export const accountsApi = { list: () => api.get('/accounts'), summary: () => api.get('/accounts/summary'), create: (d: any) => api.post('/accounts', d), update: (id: string, d: any) => api.put(`/accounts/${id}`, d), delete: (id: string) => api.delete(`/accounts/${id}`) };

export const budgetsApi = { list: () => api.get('/budgets'), create: (d: any) => api.post('/budgets', d), update: (id: string, d: any) => api.put(`/budgets/${id}`, d), delete: (id: string) => api.delete(`/budgets/${id}`) };

export const reportsApi = { monthly: (year?: number, month?: number) => api.get('/reports/monthly', { params: { year, month } }), yearly: (year?: number) => api.get('/reports/yearly', { params: { year } }), categories: (p?: any) => api.get('/reports/categories', { params: p }), cashflow: (p?: any) => api.get('/reports/cashflow', { params: p }) };
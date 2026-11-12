import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';
import { User, AuthState } from '../types';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const t = localStorage.getItem('token'); const u = localStorage.getItem('user');
    if (t && u) { try { setToken(t); setUser(JSON.parse(u)); } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); } }
    setIsLoading(false);
  };
  useEffect(() => { checkAuth(); }, []);

  const login = async (email: string, password: string) => { const { data } = await authApi.login({ email, password }); localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); };
  const register = async (email: string, password: string, name: string) => { const { data } = await authApi.register({ email, password, name }); localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout, checkAuth }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const c = useContext(AuthContext); if (!c) throw new Error('useAuth must be used within AuthProvider'); return c; };
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setIsLoading(true); try { await login(email, password); navigate('/'); } catch (err: any) { setError(err.response?.data?.error || 'Erro ao fazer login'); } finally { setIsLoading(false); } };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md"><div className="text-center mb-8"><Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600 mb-6"><Wallet className="h-10 w-10" /> FinanceHub</Link><h1 className="text-3xl font-bold text-gray-900">Bem-vindo de volta</h1><p className="text-gray-600 mt-2">Acesse seu dashboard financeiro</p></div>
        <div className="card p-6">{error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="email" className="label">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="seu@email.com" required autoComplete="email" /></div></div><div><label htmlFor="password" className="label">Senha</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div><button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">{isLoading ? 'Entrando...' : 'Entrar'}</button></form><p className="mt-6 text-center text-sm text-gray-600">Não tem conta? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Cadastre-se</Link></p></div></div></div>
  );
}
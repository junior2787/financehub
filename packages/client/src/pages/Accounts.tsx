import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Edit2, Trash2, CreditCard, PiggyBank, Landmark, TrendingUp, Wallet, DollarSign, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

const typeIcons: Record<string, React.ReactNode> = { CHECKING: <CreditCard className="h-5 w-5" />, SAVINGS: <PiggyBank className="h-5 w-5" />, CREDIT: <CreditCard className="h-5 w-5" />, INVESTMENT: <TrendingUp className="h-5 w-5" />, CASH: <Wallet className="h-5 w-5" />, OTHER: <DollarSign className="h-5 w-5" /> };

export default function Accounts() {
  const { accounts, createAccount, updateAccount, deleteAccount } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'CHECKING', currency: 'BRL', balance: 0, color: '#10b981', institution: '' });

  const resetForm = () => setForm({ name: '', type: 'CHECKING', currency: 'BRL', balance: 0, color: '#10b981', institution: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, balance: parseFloat(form.balance.toString()) || 0 };
    try { if (editing) await updateAccount(editing.id, data); else await createAccount(data); setShowModal(false); resetForm(); setEditing(null); } catch { alert('Erro ao salvar'); }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Contas</h1><p className="text-gray-600">Gerencie suas contas bancárias e carteiras</p></div><button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary"><Plus className="h-5 w-5 mr-2" /> Nova Conta</button></div>
      <div className="card p-4"><p className="text-sm text-gray-500">Saldo Total</p><p className={clsx('text-3xl font-bold', totalBalance >= 0 ? 'text-green-600' : 'text-red-600')}>R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(acc => (
          <div key={acc.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4"><div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center', `bg-${acc.color.replace('#', '')}20`)}>{typeIcons[acc.type] || <Wallet className="h-6 w-6" />}</div><div><h3 className="font-semibold text-gray-900">{acc.name}</h3><p className="text-sm text-gray-500 capitalize">{acc.type.toLowerCase()}</p></div></div>
              <div className="text-right"><p className="text-2xl font-bold text-gray-900">R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-xs text-gray-500">{acc.institution || 'Sem instituição'}</p></div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => { setEditing(acc); setForm({ name: acc.name, type: acc.type, currency: acc.currency, balance: acc.balance, color: acc.color, institution: acc.institution || '' }); setShowModal(true); }} className="btn-ghost text-sm"><Edit2 className="h-4 w-4 mr-1" /> Editar</button>
              <button onClick={() => { if (confirm('Excluir conta?')) deleteAccount(acc.id); }} className="btn-ghost text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-1" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="flex items-center justify-between border-b pb-4"><h2 className="text-lg font-semibold">{editing ? 'Editar' : 'Nova'} Conta</h2><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required /></div><div><label className="label">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="CHECKING">Corrente</option><option value="SAVINGS">Poupança</option><option value="CREDIT">Crédito</option><option value="INVESTMENT">Investimento</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Saldo Inicial</label><input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} className="input" /></div><div><label className="label">Moeda</label><input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input" maxLength={3} /></div></div><div><label className="label">Cor</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input h-10 cursor-pointer" /></div><div><label className="label">Instituição (opcional)</label><input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} className="input" placeholder="Ex: Nubank, Itaú" /></div><div className="flex gap-2 pt-4"><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? 'Salvar' : 'Criar'}</button></div></form></div></div>)}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

export default function Transactions() {
  const { transactions, categories, accounts, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [filters, setFilters] = useState({ type: '', categoryId: '', accountId: '', startDate: '', endDate: '', page: 1 });
  const [form, setForm] = useState({ type: 'EXPENSE', amount: '', description: '', categoryId: '', accountId: '', destinationAccountId: '', date: format(new Date(), 'yyyy-MM-dd'), tags: '' });

  useEffect(() => { fetchTransactions(filters); }, [fetchTransactions, filters]);

  const resetForm = () => setForm({ type: 'EXPENSE', amount: '', description: '', categoryId: '', accountId: '', destinationAccountId: '', date: format(new Date(), 'yyyy-MM-dd'), tags: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, amount: parseFloat(form.amount), destinationAccountId: form.destinationAccountId || null, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (editingTx) await updateTransaction(editingTx.id, data);
      else await createTransaction(data);
      setShowModal(false); resetForm(); setEditingTx(null);
    } catch (err) { console.error(err); alert('Erro ao salvar'); }
  };

  const handleEdit = (tx: any) => { setEditingTx(tx); setForm({ type: tx.type, amount: tx.amount.toString(), description: tx.description, categoryId: tx.categoryId || '', accountId: tx.accountId, destinationAccountId: tx.destinationAccountId || '', date: format(parseISO(tx.date), 'yyyy-MM-dd'), tags: tx.tags.join(', ') }); setShowModal(true); };

  const handleDelete = async (id: string) => { if (confirm('Excluir transação?')) await deleteTransaction(id); };

  const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Transações</h1><p className="text-gray-600">Gerencie suas receitas, despesas e transferências</p></div>
        <button onClick={() => { resetForm(); setEditingTx(null); setShowModal(true); }} className="btn-primary"><Plus className="h-5 w-5 mr-2" /> Nova Transação</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-sm text-gray-500">Receitas</p><p className="text-2xl font-bold text-green-600">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
        <div className="card p-4"><p className="text-sm text-gray-500">Despesas</p><p className="text-2xl font-bold text-red-600">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
        <div className="card p-4"><p className="text-sm text-gray-500">Saldo</p><p className={clsx('text-2xl font-bold', income - expense >= 0 ? 'text-green-600' : 'text-red-600')}>R$ {(income - expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })} className="input"><option value="">Todos os tipos</option><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option><option value="TRANSFER">Transferência</option></select>
          <select value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value, page: 1 })} className="input"><option value="">Todas categorias</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={filters.accountId} onChange={e => setFilters({ ...filters, accountId: e.target.value, page: 1 })} className="input"><option value="">Todas contas</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value, page: 1 })} className="input" placeholder="Data início" />
          <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value, page: 1 })} className="input" placeholder="Data fim" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma transação encontrada</td></tr> : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{format(parseISO(tx.date), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td className="px-4 py-3"><span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : tx.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>{tx.type === 'INCOME' ? 'Receita' : tx.type === 'EXPENSE' ? 'Despesa' : 'Transferência'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tx.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tx.account?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{clsx(tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600')({ [tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600']: true })}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => handleEdit(tx)} className="btn-ghost p-1.5"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(tx.id)} className="btn-ghost p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4"><h2 className="text-lg font-semibold">{editingTx ? 'Editar' : 'Nova'} Transação</h2><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditingTx(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option><option value="TRANSFER">Transferência</option></select></div><div><label className="label">Valor</label><input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" required /></div></div>
              <div><label className="label">Descrição</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" required /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="label">Categoria</label><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="input"><option value="">Selecione</option>{categories.filter(c => c.type === form.type || c.type === 'EXPENSE').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="label">Conta</label><select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} className="input" required><option value="">Selecione</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div></div>
              {form.type === 'TRANSFER' && <div><label className="label">Conta de Destino</label><select value={form.destinationAccountId} onChange={e => setForm({ ...form, destinationAccountId: e.target.value })} className="input"><option value="">Selecione</option>{accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
              <div><label className="label">Data</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" required /></div>
              <div><label className="label">Tags (separadas por vírgula)</label><input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input" placeholder="ex: trabalho, urgente, cartão" /></div>
              <div className="flex gap-2 pt-4"><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditingTx(null); }} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editingTx ? 'Salvar alterações' : 'Criar transação'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
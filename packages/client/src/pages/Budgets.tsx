import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Edit2, Trash2, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

export default function Budgets() {
  const { budgets, categories, createBudget, updateBudget, deleteBudget } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ categoryId: '', amount: '', period: 'MONTHLY', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '' });

  const resetForm = () => setForm({ categoryId: '', amount: '', period: 'MONTHLY', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '' });

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const data = { ...form, amount: parseFloat(form.amount) }; try { if (editing) await updateBudget(editing.id, data); else await createBudget(data); setShowModal(false); resetForm(); setEditing(null); } catch { alert('Erro ao salvar'); } };

  const getSpent = (budget: any) => 0; // Would need transaction data

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1><p className="text-gray-600">Controle seus limites de gastos por categoria</p></div><button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary"><Plus className="h-5 w-5 mr-2" /> Novo Orçamento</button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full card p-12 text-center"><Target className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum orçamento</h3><p className="text-gray-500 mb-4">Crie seu primeiro orçamento para controlar gastos</p><button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary"><Plus className="h-5 w-5 mr-2" /> Criar orçamento</button></div>
        ) : budgets.map(budget => {
          const cat = categories.find(c => c.id === budget.categoryId);
          const spent = getSpent(budget);
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const isOver = spent > budget.amount;
          return (
            <div key={budget.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3"><div className={clsx('h-10 w-10 rounded-full flex items-center justify-center', `bg-${cat?.color?.replace('#', '')}20`)} style={{ color: cat?.color }}><Target className="h-5 w-5" /></div><div><p className="font-semibold text-gray-900">{cat?.name || 'Categoria'}</p><p className="text-sm text-gray-500 capitalize">{budget.period.toLowerCase()}</p></div></div>
                <div className="flex items-center gap-2"><button onClick={() => { setEditing(budget); setForm({ categoryId: budget.categoryId, amount: budget.amount.toString(), period: budget.period, startDate: format(parseISO(budget.startDate), 'yyyy-MM-dd'), endDate: budget.endDate ? format(parseISO(budget.endDate), 'yyyy-MM-dd') : '' }); setShowModal(true); }} className="btn-ghost p-2"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (confirm('Excluir orçamento?')) deleteBudget(budget.id); }} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-gray-500">Gasto</span><span className="font-medium">R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Limite</span><span className="font-medium">R$ {budget.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={clsx('h-full rounded-full transition-all', isOver ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${Math.min(percentage, 100)}%` }}></div></div><div className="flex justify-between text-xs"><span>{percentage.toFixed(1)}% utilizado</span><span className={clsx(isOver ? 'text-red-600' : percentage > 80 ? 'text-yellow-600' : 'text-green-600')}>{isOver ? <><AlertTriangle className="h-3 w-3 inline mr-1" /> Acima do limite</> : percentage > 80 ? <><AlertTriangle className="h-3 w-3 inline mr-1" /> Atenção</> : <><CheckCircle2 className="h-3 w-3 inline mr-1" /> Dentro do limite</>}</span></div></div>
            </div>
          </div>
        )}
      </div>
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="flex items-center justify-between border-b pb-4"><h2 className="text-lg font-semibold">{editing ? 'Editar' : 'Novo'} Orçamento</h2><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div><label className="label">Categoria</label><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="input" required><option value="">Selecione</option>{categories.filter(c => c.type === 'EXPENSE').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Valor</label><input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" required /></div><div><label className="label">Período</label><select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="input"><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option></select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Início</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input" required /></div><div><label className="label">Fim (opcional)</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input" /></div></div><div className="flex gap-2 pt-4"><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? 'Salvar' : 'Criar'}</button></div></form></div></div>)}
    </div>
  );
}
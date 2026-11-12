import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Edit2, Trash2, Tag, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';

export default function Categories() {
  const { categories, createCategory, updateCategory, deleteCategory } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'EXPENSE', color: '#3b82f6', icon: 'wallet', parentId: '' });

  const resetForm = () => setForm({ name: '', type: 'EXPENSE', color: '#3b82f6', icon: 'wallet', parentId: '' });

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { if (editing) await updateCategory(editing.id, form); else await createCategory(form); setShowModal(false); resetForm(); setEditing(null); } catch { alert('Erro ao salvar'); } };

  const incomeCats = categories.filter(c => c.type === 'INCOME');
  const expenseCats = categories.filter(c => c.type === 'EXPENSE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Categorias</h1><p className="text-gray-600">Organize suas transações por categorias</p></div><button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary"><Plus className="h-5 w-5 mr-2" /> Nova Categoria</button></div>
      <div className="grid gap-6">
        {[{ label: 'Receitas', cats: incomeCats, color: 'green' }, { label: 'Despesas', cats: expenseCats, color: 'red' }].map(({ label, cats, color }) => (
          <div key={label} className="card">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-semibold text-gray-900">{label}</h3><span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{cats.length}</span></div>
            <div className="divide-y divide-gray-100">
              {cats.length === 0 ? <div className="p-8 text-center text-gray-500">Nenhuma categoria</div> : cats.map(cat => (
                <div key={cat.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className={clsx('h-10 w-10 rounded-full flex items-center justify-center', `bg-${cat.color.replace('#', '')}20`)} style={{ color: cat.color }}><Tag className="h-5 w-5" /></div><div><p className="font-medium text-gray-900">{cat.name}</p><p className="text-xs text-gray-500">Cor: {cat.color}</p></div></div>
                  <div className="flex items-center gap-2"><button onClick={() => { setEditing(cat); setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon, parentId: cat.parentId || '' }); setShowModal(true); }} className="btn-ghost p-2"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (confirm('Excluir categoria?')) deleteCategory(cat.id); }} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="flex items-center justify-between border-b pb-4"><h2 className="text-lg font-semibold">{editing ? 'Editar' : 'Nova'} Categoria</h2><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div><div><label className="label">Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input"><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option></select></div><div><label className="label">Cor</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input h-10 cursor-pointer" /></div></div><div><label className="label">Ícone (nome do ícone Lucide)</label><input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="input" placeholder="wallet, credit-card, shopping-bag..." /></div><div className="flex gap-2 pt-4"><button type="button" onClick={() => { setShowModal(false); resetForm(); setEditing(null); }} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? 'Salvar' : 'Criar'}</button></div></form></div></div>)}
    </div>
  );
}
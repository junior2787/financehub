import { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Plus, ArrowRight, BarChart2, PieChart } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import clsx from 'clsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function StatCard({ title, value, change, icon, color }: { title: string; value: string; change?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && <p className={clsx('text-sm mt-1', change.startsWith('+') ? 'text-green-600' : 'text-red-600')}>{change}</p>}
        </div>
        <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center', color)}>{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { monthlyReport, yearlyReport, fetchReports, accounts, transactions, categories } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }));

  useEffect(() => { fetchReports(currentMonth.year, currentMonth.month); }, [fetchReports, currentMonth]);

  const summary = monthlyReport?.summary;
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const balance = summary?.balance || 0;

  const prevMonth = currentMonth.month === 1 ? { year: currentMonth.year - 1, month: 12 } : { year: currentMonth.year, month: currentMonth.month - 1 };
  // In a real app, you'd fetch previous month for comparison

  const monthName = format(new Date(currentMonth.year, currentMonth.month - 1), 'MMMM yyyy', { locale: ptBR });

  // Daily chart data
  const dailyData = monthlyReport?.daily || [];
  const lineData = {
    labels: dailyData.map(d => format(parseISO(d.date), 'dd/MM')),
    datasets: [
      { label: 'Receitas', data: dailyData.map(d => d.income), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3 },
      { label: 'Despesas', data: dailyData.map(d => d.expense), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 },
    ],
  };

  // Category pie chart
  const catData = monthlyReport?.byCategory || [];
  const pieData = {
    labels: catData.slice(0, 6).map(c => c.name),
    datasets: [{ data: catData.slice(0, 6).map(c => c.amount), backgroundColor: catData.slice(0, 6).map(c => c.color) }],
  };

  // Yearly bar chart
  const yearlyData = yearlyReport?.monthly || [];
  const barData = {
    labels: yearlyData.map(m => format(new Date(m.year || currentMonth.year, m.month - 1), 'MMM', { locale: ptBR })),
    datasets: [
      { label: 'Receitas', data: yearlyData.map(m => m.income), backgroundColor: '#22c55e' },
      { label: 'Despesas', data: yearlyData.map(m => m.expense), backgroundColor: '#ef4444' },
    ],
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral das suas finanças em {monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={`${currentMonth.year}-${currentMonth.month}`} onChange={e => { const [y, m] = e.target.value.split('-'); setCurrentMonth({ year: parseInt(y), month: parseInt(m) }); }} className="input w-auto">
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(currentMonth.year, i);
              return <option key={i} value={`${currentMonth.year}-${i + 1}`}>{format(date, 'MMMM yyyy', { locale: ptBR })}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo do Mês" value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="h-6 w-6 text-white" />} color="bg-primary-600" />
        <StatCard title="Receitas" value={`R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} change={`+${summary?.transactionCount || 0} transações`} icon={<ArrowRight className="h-6 w-6 text-white rotate-45"} color="bg-green-600" />
        <StatCard title="Despesas" value={`R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} change={`${monthlyReport?.byCategory?.length || 0} categorias`} icon={<ArrowRight className="h-6 w-6 text-white -rotate-45"} color="bg-red-600" />
        <StatCard title="Contas" value={`${accounts.length}`} change={`R$ ${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total`} icon={<Wallet className="h-6 w-6 text-white"} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Fluxo Diário">
          <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `R$ ${v}` } } }} />
        </ChartCard>
        <ChartCard title="Despesas por Categoria">
          <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } }, cutout: '60%' }} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Resumo Anual">
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `R$ ${v}` } } }} />
        </ChartCard>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
            <a href="/transactions" className="text-sm text-primary-600 hover:text-primary-700">Ver todas</a>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma transação ainda</p>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={clsx('h-10 w-10 rounded-full flex items-center justify-center', tx.type === 'INCOME' ? 'bg-green-100' : tx.type === 'EXPENSE' ? 'bg-red-100' : 'bg-blue-100')}>
                      {tx.type === 'INCOME' && <TrendingUp className={clsx('h-5 w-5', tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600')} />}
                      {tx.type === 'EXPENSE' && <TrendingDown className="h-5 w-5 text-red-600" />}
                      {tx.type === 'TRANSFER' && <Wallet className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">{format(parseISO(tx.date), 'dd/MM/yyyy', { locale: ptBR })} • {tx.category?.name || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <span className={clsx('font-semibold', tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600')}>
                    {tx.type === 'INCOME' ? '+' : '-'}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
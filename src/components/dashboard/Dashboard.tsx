import { DashboardKPIs } from './DashboardKPIs';
import { CategoryProgress } from './CategoryProgress';
import { RecentExpenses } from './RecentExpenses';
import { MonthlyTrend } from './MonthlyTrend';
import { FamilyProgressCard } from './FamilyProgressCard';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';

export const Dashboard = () => {
  const { getDashboardKPIs, getCategoryProgress, expenses, loading } = useBudgetSupabase();
  const { period } = usePeriod();
  
  const kpis = getDashboardKPIs(period);
  const categoryProgress = getCategoryProgress(period);
  const recentExpenses = expenses.slice(0, 5); // Últimos 5 gastos

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs principales */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <span className="text-sm text-muted-foreground">
            {new Date(period.year, period.month - 1).toLocaleDateString('es-CL', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <DashboardKPIs data={kpis} />
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progreso por categorías actualizado */}
        <div className="animate-slide-up">
          <CategoryProgress categories={categoryProgress} />
        </div>

        {/* Gastos recientes */}
        <div className="animate-slide-up">
          <RecentExpenses expenses={recentExpenses} />
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="animate-slide-up">
        <MonthlyTrend />
      </div>
    </div>
  );
};
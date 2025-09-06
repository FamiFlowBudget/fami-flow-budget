import { DashboardKPIs } from './DashboardKPIs';
import { CategoryProgress } from './CategoryProgress';
import { RecentExpenses } from './RecentExpenses';
import { MonthlyTrend } from './MonthlyTrend';
import { FamilyProgressCard } from './FamilyProgressCard';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

export const Dashboard = () => {
  const { getDashboardKPIs, expenses, loading } = useBudgetSupabase();
  
  const kpis = getDashboardKPIs();
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
            {new Date().toLocaleDateString('es-CL', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <DashboardKPIs data={kpis} />
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progreso familiar por categorías */}
        <div className="animate-slide-up">
          <FamilyProgressCard />
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
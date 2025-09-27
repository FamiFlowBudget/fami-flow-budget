// src/pages/Dashboard.tsx (Versión Final con Lógica Jerárquica)

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCards } from '@/components/dashboards/KpiCards';
import { YearTrend } from '@/components/dashboards/YearTrend';
import { MemberStacked } from '@/components/dashboards/MemberStacked';
import { DonutDistribution } from '@/components/dashboards/DonutDistribution';
import { CategoryProgress } from '@/components/dashboards/CategoryProgress';
import { DailyBurnSparkline } from '@/components/dashboards/DailyBurnSparkline';
import { AlertsList } from '@/components/dashboards/AlertsList';
import { MemberCards } from '@/components/dashboards/MemberCards';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';
import { useMemo } from 'react';

export default function Dashboard() {
  const { 
    getDashboardKPIs, 
    getHierarchicalCategoryProgress, // <<<--- CAMBIO: Usamos la nueva función
    getYearTrendData, 
    getDailyBurnData,
    getCurrentMonthExpenses,
    budgets,
    expenses, 
    categories, 
    members,
    currency,
    loading
  } = useBudgetSupabase();
  const { period } = usePeriod();

  // Usamos useMemo para evitar recalcular estos datos en cada renderizado.
  const kpis = useMemo(() => getDashboardKPIs(period), [getDashboardKPIs, period]);
  // <<<--- CAMBIO CLAVE: Llamamos a la nueva función inteligente ---<<<
  const categoryProgress = useMemo(() => getHierarchicalCategoryProgress(period), [getHierarchicalCategoryProgress, period]);
  const yearTrendData = useMemo(() => getYearTrendData(period.year), [getYearTrendData, period.year]);
  const dailyBurnData = useMemo(() => getDailyBurnData(period), [getDailyBurnData, period]);
  const currentMonthExpenses = useMemo(() => getCurrentMonthExpenses(period), [getCurrentMonthExpenses, period]);

  // (El resto de los cálculos para los otros gráficos no cambian)
  const distributionData = useMemo(() => { /* ... */ }, [categories, currentMonthExpenses]);
  const memberStackedData = useMemo(() => { /* ... */ }, [currentMonthExpenses, categories, members]);
  const memberCardsData = useMemo(() => { /* ... */ }, [members, currentMonthExpenses, budgets, period, categories]);


  return (
      <div className="space-y-6 p-6">
        {/* El resto del componente visual es idéntico. Ya está preparado para recibir la nueva estructura de datos. */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <DashboardFilters />
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="annual">Anual</TabsTrigger>
            <TabsTrigger value="members">Por Miembro</TabsTrigger>
            <TabsTrigger value="categories" className="hidden md:flex">Por Categoría</TabsTrigger>
            <TabsTrigger value="analytics" className="hidden md:flex">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <KpiCards data={{ ...kpis, expenseCount: expenses.length }} isLoading={loading} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DonutDistribution data={distributionData} currency={currency} title="Distribución del Mes" isLoading={loading} />
              </div>
              <AlertsList categories={categoryProgress} currency={currency} isLoading={loading} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryProgress categories={categoryProgress} isLoading={loading} />
              <DailyBurnSparkline data={dailyBurnData} currency={currency} monthBudget={kpis.totalBudget} totalSpent={kpis.totalSpent} isLoading={loading} />
            </div>
            <MemberStacked data={memberStackedData} currency={currency} isLoading={loading} />
          </TabsContent>
        {/* ... (resto de las pestañas) ... */}
        </Tabs>
      </div>
  );
}
// src/pages/Index.tsx (Versión Final Sincronizada)

import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCards } from '@/components/dashboards/KpiCards';
import { YearTrend } from '@/components/dashboards/YearTrend';
import { MemberStacked } from '@/components/dashboards/MemberStacked';
import { DonutDistribution } from '@/components/dashboards/DonutDistribution';
import { CategoryProgress } from '@/components/dashboards/CategoryProgress';
import { DailyBurnSparkline } from '@/components/dashboards/DailyBurnSparkline';
import { AlertsList } from '@/components/dashboards/AlertsList';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';
import { PieChart, Tag, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

const Index = () => {
  const { 
    getDashboardKPIs, 
    getHierarchicalCategoryProgress, // <<<--- CAMBIO: Usamos la nueva función inteligente
    getYearTrendData, 
    getDailyBurnData,
    expenses, 
    categories, 
    members,
    currency,
    loading,
    getCurrentMonthExpenses 
  } = useBudgetSupabase();
  const { period, setPeriod } = usePeriod();

  // <<<--- CAMBIO CLAVE: Llamamos a la nueva función ---<<<
  const kpis = useMemo(() => getDashboardKPIs(period), [getDashboardKPIs, period]);
  const categoryProgress = useMemo(() => getHierarchicalCategoryProgress(period), [getHierarchicalCategoryProgress, period]);
  const yearTrendData = useMemo(() => getYearTrendData(period.year), [getYearTrendData, period.year]);
  const dailyBurnData = useMemo(() => getDailyBurnData(period), [getDailyBurnData, period]);
  const currentMonthExpenses = useMemo(() => getCurrentMonthExpenses(period), [getCurrentMonthExpenses, period]);

  // (El resto de los cálculos para otros gráficos no cambian)
  const distributionData = useMemo(() => {
    // ... (lógica existente)
  }, [categories, currentMonthExpenses]);

  const memberStackedData = useMemo(() => {
    // ... (lógica existente)
  }, [currentMonthExpenses, categories, members]);

  return (
    <div className="space-y-6">
      {/* Accesos rápidos (no cambia) */}
      <div className="mb-6">
        {/* ... */}
      </div>

      {/* Dashboard principal con filtros */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resumen Financiero</h1>
        </div>
        <DashboardFilters />
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
        <YearTrend data={yearTrendData} currency={currency} year={period.year} onMonthClick={(month, year) => setPeriod({ month, year })} isLoading={loading} />
      </div>
      <AddExpenseFAB />
    </div>
  );
};

export default Index;
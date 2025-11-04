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
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default function Dashboard() {
  const {
    getDashboardKPIs,
    getHierarchicalCategoryProgress,
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

  const kpis = useMemo(() => getDashboardKPIs(period), [getDashboardKPIs, period]);
  const categoryProgress = useMemo(() => getHierarchicalCategoryProgress(period), [getHierarchicalCategoryProgress, period]);
  const yearTrendData = useMemo(() => getYearTrendData(), [getYearTrendData]);
  const dailyBurnData = useMemo(() => getDailyBurnData(period), [getDailyBurnData, period]);
  const currentMonthExpenses = useMemo(() => getCurrentMonthExpenses(period), [getCurrentMonthExpenses, period]);

  const distributionData = useMemo(() => {
    return categoryProgress.map(cat => ({
      name: cat.categoryName,
      value: cat.spentAmount,
    })).filter(item => item.value > 0);
  }, [categoryProgress]);

  const memberStackedData = useMemo(() => {
    const mainCategories = categories.filter(c => !c.parentId);
    return mainCategories.map(cat => {
      const data: { [key: string]: string | number } = { name: cat.name };
      members.forEach(mem => {
        data[mem.name] = currentMonthExpenses
          .filter(e => {
            const expenseCategory = categories.find(c => c.id === e.categoryId);
            return (e.memberId === mem.id) && (e.categoryId === cat.id || expenseCategory?.parentId === cat.id);
          })
          .reduce((sum, e) => sum + e.amount, 0);
      });
      return data;
    }).filter(item => Object.values(item).some(val => typeof val === 'number' && val > 0));
  }, [currentMonthExpenses, categories, members]);

  const memberCardsData = useMemo(() => {
    return members.map(member => {
      const memberExpenses = currentMonthExpenses.filter(e => e.memberId === member.id);
      const totalSpent = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = budgets
        .filter(b => b.year === period.year && b.month === period.month)
        .reduce((sum, b) => sum + b.amount, 0) / members.length; // Simple budget split for now
      return {
        member,
        totalSpent,
        totalBudget,
        expenseCount: memberExpenses.length
      };
    });
  }, [members, currentMonthExpenses, budgets, period]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
      <div className="space-y-6 p-6">
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
          <TabsContent value="annual" className="space-y-6">
             <YearTrend data={yearTrendData} currency={currency} isLoading={loading} />
          </TabsContent>
          <TabsContent value="members" className="space-y-6">
             <MemberCards data={memberCardsData} currency={currency} isLoading={loading} />
          </TabsContent>
        </Tabs>
      </div>
  );
}

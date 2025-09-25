// src/pages/Dashboard.tsx (Versión Corregida)

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
    getCategoryProgress, 
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
  const categoryProgress = useMemo(() => getCategoryProgress(period), [getCategoryProgress, period]);
  const yearTrendData = useMemo(() => getYearTrendData(period.year), [getYearTrendData, period.year]);
  const dailyBurnData = useMemo(() => getDailyBurnData(period), [getDailyBurnData, period]);
  const currentMonthExpenses = useMemo(() => getCurrentMonthExpenses(period), [getCurrentMonthExpenses, period]);

  const distributionData = useMemo(() => {
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalSpent === 0) return [];
    
    return categories
      .map((cat, i) => {
        const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === cat.id);
        const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          categoryName: cat.name,
          amount,
          percentage: (amount / totalSpent) * 100,
          color: `hsl(${i * 137.5 % 360}, 70%, 50%)`
        };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [categories, currentMonthExpenses]);

  const memberStackedData = useMemo(() => {
    const dataByCat: { [key: string]: { members: any[], total: number } } = {};
    currentMonthExpenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.categoryId);
      const member = members.find(m => m.id === expense.memberId);
      if (!category || !member) return;
      if (!dataByCat[category.name]) {
        dataByCat[category.name] = { members: [], total: 0 };
      }
      let memberEntry = dataByCat[category.name].members.find(m => m.memberName === member.name);
      if (!memberEntry) {
        memberEntry = { memberName: member.name, amount: 0 };
        dataByCat[category.name].members.push(memberEntry);
      }
      memberEntry.amount += expense.amount;
      dataByCat[category.name].total += expense.amount;
    });
    return Object.entries(dataByCat).map(([categoryName, data]) => ({
      category: categoryName,
      ...data
    }));
  }, [currentMonthExpenses, categories, members]);

  const memberCardsData = useMemo(() => {
    return members.map(member => {
      const memberExpenses = currentMonthExpenses.filter(e => e.memberId === member.id);
      const monthlySpent = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
      const memberBudgets = budgets.filter(b => b.memberId === member.id && b.year === period.year && b.month === period.month);
      const monthlyBudget = memberBudgets.reduce((sum, b) => sum + b.amount, 0);
      const percentage = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;
      let status: 'success' | 'warning' | 'danger' = 'success';
      if (percentage >= 90) status = 'danger';
      else if (percentage >= 75) status = 'warning';
      const expensesByCategory: {[key: string]: number} = {};
      memberExpenses.forEach(expense => {
        expensesByCategory[expense.categoryId] = (expensesByCategory[expense.categoryId] || 0) + expense.amount;
      });
      const topCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([categoryId, amount], i) => ({
          categoryName: categories.find(c => c.id === categoryId)?.name || 'Desconocido',
          amount,
          color: `hsl(${i * 137.5 % 360}, 70%, 50%)`
        }));
      return {
        id: member.id, name: member.name, photoUrl: member.photoUrl, role: member.role,
        monthlySpent, monthlyBudget, percentage, status, expenseCount: memberExpenses.length, topCategories
      };
    });
  }, [members, currentMonthExpenses, budgets, period, categories]);

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
            <MemberCards members={memberCardsData} currency={currency} isLoading={loading} />
          </TabsContent>
          <TabsContent value="categories" className="space-y-6">
            <CategoryProgress categories={categoryProgress} showAll={true} isLoading={loading} />
          </TabsContent>
          {/* La línea duplicada que causaba el error ha sido eliminada. */}
        </Tabs>
      </div>
  );
}

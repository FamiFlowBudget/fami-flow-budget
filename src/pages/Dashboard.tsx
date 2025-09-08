import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCards } from '@/components/dashboards/KpiCards';
import { YearTrend } from '@/components/dashboards/YearTrend';
import { MemberStacked } from '@/components/dashboards/MemberStacked';
import { DonutDistribution } from '@/components/dashboards/DonutDistribution';
import { CategoryProgress } from '@/components/dashboards/CategoryProgress';
import { DailyBurnSparkline } from '@/components/dashboards/DailyBurnSparkline';
import { AlertsList } from '@/components/dashboards/AlertsList';
import { VarianceWaterfall } from '@/components/dashboards/VarianceWaterfall';
import { CategoryMonthHeatmap } from '@/components/dashboards/CategoryMonthHeatmap';
import { MemberCards } from '@/components/dashboards/MemberCards';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { FiltersProvider } from '@/providers/FiltersProvider';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';

export default function Dashboard() {
  const { 
    getDashboardKPIs, 
    getCategoryProgress, 
    getYearTrendData, 
    getDailyBurnData,
    getFamilyDataByCategory,
    expenses, 
    categories, 
    members,
    getCurrentMonthExpenses 
  } = useBudgetSupabase();
  const { period, setPeriod } = usePeriod();
  const [activeTab, setActiveTab] = useState('overview');

  // Datos reales del dashboard
  const kpis = getDashboardKPIs(period);
  const categoryProgress = getCategoryProgress(period);
  const yearTrendData = getYearTrendData();
  const dailyBurnData = getDailyBurnData(period);
  const familyData = getFamilyDataByCategory(period);
  const currentMonthExpenses = getCurrentMonthExpenses(period);

  // Datos para distribución (donut)
  const distributionData = categories.map((cat, i) => {
    const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === cat.id);
    const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAmount = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      amount,
      percentage,
      color: `hsl(${i * 137.5 % 360}, 70%, 50%)`
    };
  }).filter(item => item.amount > 0);

  // Datos para miembros stacked
  const memberStackedData = familyData.map(fd => ({
    category: fd.category.name,
    members: fd.memberData.map((md, i) => ({
      memberId: md.member.id,
      memberName: md.member.name,
      amount: md.spentAmount,
      percentage: md.percentage,
      color: `hsl(${i * 137.5 % 360}, 70%, 50%)`
    })),
    total: fd.familySpent
  }));

  // Datos para cards de miembros
  const memberCardsData = members.map(member => {
    const memberExpenses = currentMonthExpenses.filter(e => e.memberId === member.id);
    const monthlySpent = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyBudget = 100000; // Mock budget
    const percentage = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;
    
    let status: 'success' | 'warning' | 'danger' = 'success';
    if (percentage >= 90) status = 'danger';
    else if (percentage >= 75) status = 'warning';

    return {
      id: member.id,
      name: member.name,
      photoUrl: member.photoUrl,
      role: member.role,
      monthlySpent,
      monthlyBudget,
      percentage,
      status,
      variance: monthlyBudget - monthlySpent,
      expenseCount: memberExpenses.length,
      topCategories: categories.slice(0, 3).map((cat, i) => ({
        categoryName: cat.name,
        amount: Math.random() * monthlySpent * 0.3,
        color: `hsl(${i * 137.5 % 360}, 70%, 50%)`
      })),
      last6Months: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(0, i).toLocaleDateString('es-CL', { month: 'short' }),
        spent: Math.random() * monthlySpent
      }))
    };
  });

  // Datos para waterfall de varianza
  const waterfallData = yearTrendData.map(ytd => ({
    ...ytd,
    variance: ytd.budget - ytd.spent,
    isPositive: ytd.budget >= ytd.spent,
    cumulativeVariance: ytd.budget - ytd.spent // Simplificado
  }));

  // Datos para heatmap
  const heatmapData = categories.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    monthlyData: Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const monthName = new Date(0, monthIndex).toLocaleDateString('es-CL', { month: 'short' });
      const budget = Math.random() * 100000;
      const spent = Math.random() * budget * 1.2;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      
      let status: 'success' | 'warning' | 'danger' = 'success';
      if (percentage >= 90) status = 'danger';
      else if (percentage >= 75) status = 'warning';
      
      return {
        month,
        monthName,
        budget,
        spent,
        percentage,
        status
      };
    })
  }));

  return (
    <FiltersProvider>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <DashboardFilters />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="annual">Anual</TabsTrigger>
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <KpiCards data={{ ...kpis, expenseCount: expenses.length }} />
            
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DonutDistribution 
                  data={distributionData}
                  currency="CLP"
                  title="Distribución del Mes"
                />
              </div>
              <AlertsList 
                categories={categoryProgress}
                currency="CLP"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryProgress 
                categories={categoryProgress}
              />
              <DailyBurnSparkline 
                data={dailyBurnData}
                currency="CLP"
                monthBudget={kpis.totalBudget}
                totalSpent={kpis.totalSpent}
              />
            </div>

            <MemberStacked 
              data={memberStackedData}
              currency="CLP"
            />
          </TabsContent>

          <TabsContent value="annual" className="space-y-6">
            <YearTrend 
              data={yearTrendData}
              currency="CLP"
              year={period.year}
              onMonthClick={(month, year) => setPeriod({ month, year })}
            />
            
            <VarianceWaterfall 
              data={waterfallData}
              currency="CLP"
              year={period.year}
              onMonthClick={(month, year) => setPeriod({ month, year })}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <MemberCards 
              members={memberCardsData}
              currency="CLP"
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryProgress 
              categories={categoryProgress}
              showAll={true}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <CategoryMonthHeatmap 
              data={heatmapData}
              currency="CLP"
              year={period.year}
            />
          </TabsContent>
        </Tabs>
      </div>
    </FiltersProvider>
  );
}
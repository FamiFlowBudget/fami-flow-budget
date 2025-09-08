import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { DemoDataGenerator } from "@/components/demo/DemoDataGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PieChart, Tag, Settings, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
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

  return (
    <FiltersProvider>
      <div className="space-y-6">
        {/* Accesos rápidos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Accesos Rápidos</h2>
            <DemoDataGenerator />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/budget">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <PieChart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Presupuestos</CardTitle>
                      <CardDescription>Gestiona presupuestos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/categories">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/80 rounded-lg">
                      <Tag className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Categorías</CardTitle>
                      <CardDescription>Organiza gastos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/dashboard">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-accent/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dashboard</CardTitle>
                      <CardDescription>Análisis completo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/reports">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-success/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Reportes</CardTitle>
                      <CardDescription>Análisis detallado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Dashboard principal con filtros */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Resumen Financiero</h1>
          </div>

          <DashboardFilters />

          {/* KPIs principales */}
          <KpiCards data={{ ...kpis, expenseCount: expenses.length }} />
          
          {/* Gráficos principales */}
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

          {/* Análisis anual */}
          <YearTrend 
            data={yearTrendData}
            currency="CLP"
            year={period.year}
            onMonthClick={(month, year) => setPeriod({ month, year })}
          />
        </div>
        
        {/* FAB para agregar gastos */}
        <AddExpenseFAB />
      </div>
    </FiltersProvider>
  );
};

export default Index;

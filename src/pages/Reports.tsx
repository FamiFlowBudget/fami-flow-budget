import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';
import { BarChart2, TrendingUp, Calendar, PieChart, FileText, Download } from "lucide-react";

export default function Reports() {
  const { 
    getDashboardKPIs, 
    getHierarchicalCategoryProgress,
    getYearTrendData, 
    getDailyBurnData,
    expenses, 
    categories, 
    members,
    currency,
    loading
  } = useBudgetSupabase();
  const { period, setPeriod } = usePeriod();
  const [activeTab, setActiveTab] = useState('financial');

  // Datos reales del dashboard
  const kpis = getDashboardKPIs(period);
  const categoryProgress = getHierarchicalCategoryProgress(period);
  const yearTrendData = getYearTrendData();
  const dailyBurnData = getDailyBurnData(period);

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === period.year && expenseDate.getMonth() + 1 === period.month;
  });

  // Datos para distribución (donut)
  const distributionData = categoryProgress.map(cat => ({
    name: cat.categoryName,
    value: cat.spentAmount,
  })).filter(item => item.value > 0);

  // Datos para miembros stacked
  const memberStackedData = (() => {
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
  })();

  // Datos para cards de miembros
  const memberCardsData = (() => {
    return members.map(member => {
      const memberExpenses = currentMonthExpenses.filter(e => e.memberId === member.id);
      const totalSpent = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = kpis.totalBudget / (members.length || 1);
      return {
        member,
        totalSpent,
        totalBudget,
        expenseCount: memberExpenses.length
      };
    });
  })();

  // Datos para waterfall de varianza
  const waterfallData = yearTrendData.map(ytd => ({
    name: ytd.name,
    budget: ytd.budget,
    spent: ytd.spent,
    variance: ytd.budget - ytd.spent,
  }));

  // Datos para heatmap
  const heatmapData = useMemo(() => {
    const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === period.year);
    const mainCategories = categories.filter(c => !c.parentId);

    return mainCategories.map(cat => ({
      categoryName: cat.name,
      monthlyData: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthName = new Date(period.year, i, 1).toLocaleString('default', { month: 'short' });

        const spent = yearExpenses
          .filter(e => {
            const expenseCategory = categories.find(c => c.id === e.categoryId);
            const expenseDate = new Date(e.date);
            return (expenseDate.getMonth() + 1 === month) && (e.categoryId === cat.id || expenseCategory?.parentId === cat.id);
          })
          .reduce((sum, e) => sum + e.amount, 0);

        return { monthName, value: spent };
      }),
    }));
  }, [expenses, categories, period.year]);

  const exportReport = () => {
    // Mock export functionality
    alert('Funcionalidad de exportación en desarrollo');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
            <p className="text-muted-foreground mt-2">
              Análisis completo de patrones financieros y tendencias
            </p>
          </div>
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>

        <DashboardFilters />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="family">Familiar</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-6">
            {/* KPIs principales */}
            <KpiCards data={{ ...kpis, expenseCount: expenses.length }} />
            
            {/* Análisis financiero */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DonutDistribution 
                  data={distributionData}
                  currency="CLP"
                  title="Distribución de Gastos"
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
                showAll={true}
              />
              <DailyBurnSparkline 
                data={dailyBurnData}
                currency="CLP"
                monthBudget={kpis.totalBudget}
                totalSpent={kpis.totalSpent}
              />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
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

          <TabsContent value="analytics" className="space-y-6">
            <CategoryMonthHeatmap 
              data={heatmapData}
              currency="CLP"
              year={period.year}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Patrones de Gasto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Día con más gasto</p>
                        <p className="font-semibold">Viernes</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Categoría top</p>
                        <p className="font-semibold">Alimentación</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Promedio diario</p>
                        <p className="font-semibold">$15.000</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tendencia</p>
                        <p className="font-semibold text-success">↓ -5%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Estacionalidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Mes más alto</p>
                        <p className="font-semibold">Diciembre</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mes más bajo</p>
                        <p className="font-semibold">Febrero</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Variación</p>
                        <p className="font-semibold">±25%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Predictibilidad</p>
                        <p className="font-semibold text-success">Alta</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="family" className="space-y-6">
            <MemberCards 
              members={memberCardsData}
              currency="CLP"
            />

            <MemberStacked 
              data={memberStackedData}
              currency="CLP"
            />
          </TabsContent>
        </Tabs>
      </div>
  );
}
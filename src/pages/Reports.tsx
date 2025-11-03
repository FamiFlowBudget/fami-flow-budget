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
import { FiltersProvider } from '@/providers/FiltersProvider';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';
import { BarChart2, TrendingUp, Calendar, PieChart, FileText, Download } from "lucide-react";

export default function Reports() {
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
  const [activeTab, setActiveTab] = useState('financial');

  // Datos reales del dashboard
  const kpis = getDashboardKPIs(period);
  const categoryProgress = getCategoryProgress(period);
  const yearTrendData = getYearTrendData();
  const dailyBurnData = getDailyBurnData(period);
  const familyData = getFamilyDataByCategory(period);
  const currentMonthExpenses = getCurrentMonthExpenses(period);

  // No hay necesidad de calcular distributionData, memberStackedData, etc. aquí
  // Los componentes individuales pueden obtener los datos que necesitan del hook
  // o los datos ya calculados como `kpis`, `categoryProgress`, etc.

  const exportReport = () => {
    // Mock export functionality
    alert('Funcionalidad de exportación en desarrollo');
  };

  return (
    <FiltersProvider>
      <div className="space-y-6">
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
                  data={categoryProgress}
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
              data={yearTrendData}
              currency="CLP"
              year={period.year}
              onMonthClick={(month, year) => setPeriod({ month, year })}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <CategoryMonthHeatmap 
              data={yearTrendData}
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
              members={members.map(m => ({
                name: m.name,
                totalSpent: familyData.find(fd => fd.name === m.name)?.totalSpent || 0,
                expenseCount: familyData.find(fd => fd.name === m.name)?.expenseCount || 0,
              }))}
              currency="CLP"
            />

            <MemberStacked 
              data={familyData}
              currency="CLP"
            />
          </TabsContent>
        </Tabs>
      </div>
    </FiltersProvider>
  );
}
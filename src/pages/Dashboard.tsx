import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCards } from '@/components/dashboards/KpiCards';
import { YearTrend } from '@/components/dashboards/YearTrend';
import { MemberStacked } from '@/components/dashboards/MemberStacked';
import { DonutDistribution } from '@/components/dashboards/DonutDistribution';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { FiltersProvider } from '@/providers/FiltersProvider';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { usePeriod } from '@/providers/PeriodProvider';

export default function Dashboard() {
  const { getDashboardKPIs, expenses, categories, members } = useBudgetSupabase();
  const { period, setPeriod } = usePeriod();
  const [activeTab, setActiveTab] = useState('overview');

  const kpis = getDashboardKPIs();

  // Mock data para demostración
  const mockDistribution = categories.slice(0, 5).map((cat, i) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    amount: Math.random() * 100000,
    percentage: Math.random() * 30 + 5,
    color: `hsl(${i * 60}, 70%, 50%)`
  }));

  const mockYearData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleDateString('es-CL', { month: 'short' }),
    monthNumber: i + 1,
    budget: Math.random() * 200000 + 100000,
    spent: Math.random() * 180000 + 80000,
    budgetCumulative: (i + 1) * 150000,
    spentCumulative: (i + 1) * 120000,
  }));

  const mockMemberData = categories.slice(0, 4).map(cat => ({
    category: cat.name,
    members: members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      amount: Math.random() * 50000,
      percentage: Math.random() * 100,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    })),
    total: Math.random() * 150000
  }));

  return (
    <FiltersProvider>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <DashboardFilters />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="annual">Anual</TabsTrigger>
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <KpiCards data={{ ...kpis, expenseCount: expenses.length }} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <DonutDistribution 
                data={mockDistribution}
                currency="CLP"
                title="Distribución del Mes"
              />
              <MemberStacked 
                data={mockMemberData}
                currency="CLP"
              />
            </div>
          </TabsContent>

          <TabsContent value="annual" className="space-y-6">
            <YearTrend 
              data={mockYearData}
              currency="CLP"
              year={period.year}
              onMonthClick={(month, year) => setPeriod({ month, year })}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {members.map(member => (
                <Card key={member.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gasto del mes:</span>
                        <span className="font-semibold">$75.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Presupuesto:</span>
                        <span>$100.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disponible:</span>
                        <span className="text-success">$25.000</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid gap-4">
              {categories.slice(0, 6).map(category => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">$45.000</div>
                        <div className="text-sm text-muted-foreground">75% del presupuesto</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </FiltersProvider>
  );
}
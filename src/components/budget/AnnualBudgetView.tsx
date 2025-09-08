import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, TrendingUp, User } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import { usePeriod } from '@/providers/PeriodProvider';
import * as Icons from 'lucide-react';

interface AnnualBudgetViewProps {
  selectedMembers: string[];
  onEditBudget: (categoryId: string, memberId: string, month: number, existingBudget?: any) => void;
  onDeleteBudget?: (budgetId: string, categoryName: string, memberName: string) => void;
}

export const AnnualBudgetView = ({ selectedMembers, onEditBudget, onDeleteBudget }: AnnualBudgetViewProps) => {
  const { budgets, categories, members, currentMember } = useBudgetSupabase();
  const { period } = usePeriod();

  // Filtrar presupuestos por año actual
  const yearBudgets = budgets.filter(b => b.year === period.year);

  // Organizar datos por categoría y mes
  const categoryData = categories.map(category => {
    const categoryBudgets = yearBudgets.filter(b => b.categoryId === category.id);
    
    // Datos por mes
    const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const monthBudgets = categoryBudgets.filter(b => b.month === month);
      
      const memberTotals = members
        .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
        .map(member => {
          const memberBudget = monthBudgets.find(b => b.memberId === member.id);
          return {
            member,
            amount: memberBudget?.amount || 0
          };
        });

      const monthTotal = memberTotals.reduce((sum, mt) => sum + mt.amount, 0);

      return {
        month,
        monthName: new Date(period.year, monthIndex).toLocaleDateString('es-CL', { month: 'short' }),
        memberTotals,
        total: monthTotal
      };
    });

    const yearTotal = monthlyData.reduce((sum, md) => sum + md.total, 0);
    const avgMonth = yearTotal / 12;

    return {
      category,
      monthlyData,
      yearTotal,
      avgMonth,
      hasData: yearTotal > 0
    };
  }).filter(cd => cd.hasData);

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  const totalAnnualBudget = categoryData.reduce((sum, cd) => sum + cd.yearTotal, 0);
  const avgMonthlyBudget = totalAnnualBudget / 12;

  return (
    <div className="space-y-6">
      {/* Resumen anual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Anual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Año {period.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgMonthlyBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Por mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">
              Con presupuesto asignado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vista por categorías */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vista Anual {period.year} - Por Categorías
          </CardTitle>
          <CardDescription>
            Distribución mensual de presupuestos por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay presupuestos configurados para este año</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categoryData.map((data) => (
                <div key={data.category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getIconComponent(data.category.icon)}
                      <div>
                        <h3 className="font-medium">{data.category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Total anual: {formatCurrency(data.yearTotal)} | 
                          Promedio: {formatCurrency(data.avgMonth)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid mensual */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {data.monthlyData.map((monthData) => (
                      <div 
                        key={monthData.month}
                        className="border rounded p-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {monthData.monthName}
                        </div>
                        <div className="text-sm font-bold">
                          {formatCurrency(monthData.total)}
                        </div>
                        
                        {/* Detalle por miembros si hay datos */}
                        {monthData.total > 0 && (
                          <div className="mt-2 space-y-1">
                            {monthData.memberTotals
                              .filter(mt => mt.amount > 0)
                              .map(memberTotal => (
                              <div key={memberTotal.member.id} className="flex items-center justify-between text-xs">
                                <span className="truncate">{memberTotal.member.name}</span>
                                <span className="font-medium">{formatCurrency(memberTotal.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Botón para editar/agregar */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full mt-2 h-6 text-xs"
                          onClick={() => {
                            // Para vista anual, editamos el primer miembro filtrado o el primero disponible
                            const targetMember = selectedMembers.length > 0 
                              ? members.find(m => selectedMembers.includes(m.id))
                              : members[0];
                            
                            if (targetMember) {
                              const existingBudget = monthData.memberTotals
                                .find(mt => mt.member.id === targetMember.id);
                              onEditBudget(
                                data.category.id, 
                                targetMember.id, 
                                monthData.month,
                                existingBudget
                              );
                            }
                          }}
                        >
                          {monthData.total > 0 ? 'Editar' : 'Agregar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
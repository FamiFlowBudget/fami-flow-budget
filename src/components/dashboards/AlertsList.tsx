// src/components/dashboards/AlertsList.tsx (Versión Inteligente)

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/types/budget';
import { HierarchicalBudgetProgress } from '@/hooks/useBudgetSupabase'; // Importamos el nuevo tipo

interface Alert {
  id: string;
  status: 'warning' | 'danger';
  title: string;
  description: string;
  amount: number;
  percentage: number;
  categoryId: string;
}

interface AlertsListProps {
  categories: HierarchicalBudgetProgress[];
  currency: string;
  isLoading?: boolean;
  onCategoryClick?: (categoryId: string) => void;
}

export const AlertsList = ({ categories, currency, isLoading, onCategoryClick }: AlertsListProps) => {
  
  // <<<--- LÓGICA SIMPLIFICADA ---<<<
  // Aplanamos la estructura y filtramos solo las categorías con alertas
  const alerts = useMemo((): Alert[] => {
    if (!categories) return [];

    const allAlerts: Alert[] = [];

    categories.forEach(mainCat => {
      // Añadir la categoría principal si tiene una alerta
      if (mainCat.status === 'warning' || mainCat.status === 'danger') {
        allAlerts.push({
          id: mainCat.categoryId,
          status: mainCat.status,
          title: `${mainCat.categoryName} ${mainCat.status === 'danger' ? 'excedió el presupuesto' : 'cerca del límite'}`,
          description: `Has gastado ${formatCurrency(mainCat.spentAmount, currency as any)} de ${formatCurrency(mainCat.budgetAmount, currency as any)}`,
          amount: mainCat.budgetAmount - mainCat.spentAmount,
          percentage: mainCat.percentage,
          categoryId: mainCat.categoryId,
        });
      }

      // Añadir subcategorías si tienen alertas
      mainCat.subcategories.forEach(subCat => {
        if (subCat.status === 'warning' || subCat.status === 'danger') {
          allAlerts.push({
            id: subCat.categoryId,
            status: subCat.status,
            title: `${subCat.categoryName} ${subCat.status === 'danger' ? 'excedió el presupuesto' : 'cerca del límite'}`,
            description: `Gastado ${formatCurrency(subCat.spentAmount, currency as any)} de ${formatCurrency(subCat.budgetAmount, currency as any)}`,
            amount: subCat.budgetAmount - subCat.spentAmount,
            percentage: subCat.percentage,
            categoryId: subCat.categoryId,
          });
        }
      });
    });

    // Ordenar: las alertas de 'danger' (gasto excedido) primero
    return allAlerts.sort((a, b) => {
      if (a.status === 'danger' && b.status !== 'danger') return -1;
      if (a.status !== 'danger' && b.status === 'danger') return 1;
      return b.percentage - a.percentage; // Luego por mayor porcentaje
    });
  }, [categories, currency]);

  if (isLoading) {
    return <Card className="p-6 text-center"><p>Cargando alertas...</p></Card>;
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-success" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="mx-auto h-8 w-8 text-success mb-2" />
            <p className="text-sm font-medium">Todo bajo control</p>
            <p className="text-xs">No hay alertas de presupuesto pendientes.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas
            <Badge variant="secondary" className="ml-2">{alerts.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 4).map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                {alert.status === 'danger' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-warning" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{alert.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
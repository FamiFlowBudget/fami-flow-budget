import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Users, Settings } from 'lucide-react';
import { formatCurrency, BudgetProgress } from '@/types/budget';

interface Alert {
  id: string;
  type: 'overspending' | 'no_budget' | 'high_usage' | 'member_overspending';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  action?: string;
  categoryId?: string;
  memberId?: string;
}

interface AlertsListProps {
  categories: BudgetProgress[];
  currency: string;
  onCategoryClick?: (categoryId: string) => void;
  onMemberClick?: (memberId: string) => void;
}

export const AlertsList = ({ 
  categories, 
  currency, 
  onCategoryClick, 
  onMemberClick 
}: AlertsListProps) => {
  // Generar alertas basadas en los datos
  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Alertas por sobregasto (>100%)
    categories.forEach(cat => {
      if (cat.percentage > 100) {
        alerts.push({
          id: `overspend_${cat.categoryId}`,
          type: 'overspending',
          title: `${cat.categoryName} excedió el presupuesto`,
          description: `Has gastado ${formatCurrency(cat.spentAmount, currency as any)} de ${formatCurrency(cat.budgetAmount, currency as any)}`,
          amount: cat.spentAmount - cat.budgetAmount,
          percentage: cat.percentage,
          categoryId: cat.categoryId,
          action: 'Ver categoría'
        });
      }
    });

    // Alertas por alto uso (75-90%)
    categories.forEach(cat => {
      if (cat.percentage >= 75 && cat.percentage <= 100) {
        alerts.push({
          id: `high_usage_${cat.categoryId}`,
          type: 'high_usage',
          title: `${cat.categoryName} cerca del límite`,
          description: `${cat.percentage.toFixed(1)}% del presupuesto utilizado`,
          amount: cat.budgetAmount - cat.spentAmount,
          percentage: cat.percentage,
          categoryId: cat.categoryId,
          action: 'Revisar gastos'
        });
      }
    });

    return alerts.sort((a, b) => {
      // Priorizar por tipo y porcentaje
      const typeOrder = { 'overspending': 1, 'high_usage': 2, 'no_budget': 3, 'member_overspending': 4 };
      if (a.type !== b.type) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return (b.percentage || 0) - (a.percentage || 0);
    });
  };

  const alerts = generateAlerts();

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'overspending':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high_usage':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'no_budget':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      case 'member_overspending':
        return <Users className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'overspending':
        return 'destructive' as const;
      case 'high_usage':
        return 'secondary' as const;
      case 'no_budget':
        return 'outline' as const;
      case 'member_overspending':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleAlertAction = (alert: Alert) => {
    if (alert.categoryId && onCategoryClick) {
      onCategoryClick(alert.categoryId);
    } else if (alert.memberId && onMemberClick) {
      onMemberClick(alert.memberId);
    }
  };

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
            <div className="text-success mb-2">✓</div>
            <p className="text-sm">Todo está bajo control</p>
            <p className="text-xs">No hay alertas pendientes</p>
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
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{alert.title}</p>
                    <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                      {alert.percentage ? `${alert.percentage.toFixed(0)}%` : 'Sin presupuesto'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  {alert.amount && (
                    <p className={`text-xs font-semibold mt-1 ${
                      alert.type === 'overspending' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {alert.type === 'overspending' ? 'Exceso: ' : 'Disponible: '}
                      {formatCurrency(alert.amount, currency as any)}
                    </p>
                  )}
                </div>
              </div>
              {alert.action && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAlertAction(alert)}
                  className="shrink-0 text-xs"
                >
                  {alert.action}
                </Button>
              )}
            </div>
          ))}
          
          {alerts.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver {alerts.length - 5} alertas más
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
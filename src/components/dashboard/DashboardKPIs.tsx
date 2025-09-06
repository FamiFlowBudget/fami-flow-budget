import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardKPIs as KPIData, formatCurrency } from '@/types/budget';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

interface DashboardKPIsProps {
  data: KPIData;
}

export const DashboardKPIs = ({ data }: DashboardKPIsProps) => {
  const { totalBudget, totalSpent, remaining, percentage, status, currency } = data;

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'danger':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border';
    }
  };

  const getProgressClasses = (status: string) => {
    switch (status) {
      case 'success':
        return 'progress-success';
      case 'warning':
        return 'progress-warning';
      case 'danger':
        return 'progress-danger';
      default:
        return '';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Presupuesto Total */}
      <Card className={`p-6 card-gradient border-2 ${getStatusClasses(status)}`}>
        <div className="flex items-center space-x-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Presupuesto</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(totalBudget, currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Mensual asignado</p>
      </Card>

      {/* Gasto Total */}
      <Card className={`p-6 card-gradient border-2 ${getStatusClasses(status)}`}>
        <div className="flex items-center space-x-2 mb-2">
          <DollarSign className="h-5 w-5 text-expense" />
          <span className="text-sm font-medium text-muted-foreground">Gastado</span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(totalSpent, currency)}
        </div>
        <div className="flex items-center space-x-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% del presupuesto
          </span>
        </div>
      </Card>

      {/* Disponible */}
      <Card className={`p-6 card-gradient border-2 ${getStatusClasses(status)}`}>
        <div className="flex items-center space-x-2 mb-2">
          {remaining >= 0 ? (
            <TrendingUp className="h-5 w-5 text-success" />
          ) : (
            <TrendingDown className="h-5 w-5 text-destructive" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {remaining >= 0 ? 'Disponible' : 'Excedido'}
          </span>
        </div>
        <div className={`text-2xl font-bold ${
          remaining >= 0 ? 'text-success' : 'text-destructive'
        }`}>
          {formatCurrency(Math.abs(remaining), currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {remaining >= 0 ? 'Puedes gastar' : 'Te has excedido'}
        </p>
      </Card>

      {/* Progreso General */}
      <Card className={`p-6 card-gradient border-2 ${getStatusClasses(status)}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Progreso</span>
          <span className={`text-sm font-bold ${
            status === 'success' ? 'text-success' :
            status === 'warning' ? 'text-warning' : 'text-destructive'
          }`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-3 mb-2"
        />
        <p className="text-xs text-muted-foreground">
          {status === 'success' && 'Vas muy bien'}
          {status === 'warning' && '¡Cuidado con el gasto!'}
          {status === 'danger' && '¡Límite superado!'}
        </p>
      </Card>
    </div>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface KpiData {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  currency: string;
  expenseCount: number;
}

interface KpiCardsProps {
  data: KpiData;
}

export const KpiCards = ({ data }: KpiCardsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'danger': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default' as const;
      case 'warning': return 'secondary' as const;
      case 'danger': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Presupuesto Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalBudget, data.currency as any)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total del mes
          </p>
        </CardContent>
      </Card>

      {/* Gasto Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalSpent, data.currency as any)}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.expenseCount} gastos registrados
          </p>
        </CardContent>
      </Card>

      {/* Disponible/Excedido */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {data.remaining >= 0 ? 'Disponible' : 'Excedido'}
          </CardTitle>
          {data.remaining >= 0 ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(data.remaining), data.currency as any)}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.remaining >= 0 ? 'Puedes gastar' : 'Sobre el presupuesto'}
          </p>
        </CardContent>
      </Card>

      {/* Progreso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          <Badge variant={getBadgeVariant(data.status)} className="text-xs">
            {data.status === 'success' ? 'En control' : 
             data.status === 'warning' ? 'Atención' : 'Peligro'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`text-2xl font-bold ${getStatusColor(data.status)}`}>
              {data.percentage.toFixed(1)}%
            </div>
            <Progress 
              value={Math.min(data.percentage, 100)} 
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Del presupuesto mensual
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
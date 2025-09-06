import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface WaterfallData {
  month: string;
  monthNumber: number;
  budget: number;
  spent: number;
  variance: number;
  isPositive: boolean;
  cumulativeVariance: number;
}

interface VarianceWaterfallProps {
  data: WaterfallData[];
  currency: string;
  year: number;
  onMonthClick?: (monthNumber: number, year: number) => void;
}

export const VarianceWaterfall = ({ data, currency, year, onMonthClick }: VarianceWaterfallProps) => {
  const handleBarClick = (data: any) => {
    if (onMonthClick && data?.monthNumber) {
      onMonthClick(data.monthNumber, year);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Mes', 'Presupuesto', 'Gasto', 'Varianza', 'Varianza Acumulada'],
      ...data.map(item => [
        item.month,
        item.budget,
        item.spent,
        item.variance,
        item.cumulativeVariance
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varianza-mensual-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p>Presupuesto: {formatCurrency(data.budget, currency as any)}</p>
            <p>Gasto: {formatCurrency(data.spent, currency as any)}</p>
            <p className={data.isPositive ? 'text-success' : 'text-destructive'}>
              Varianza: {data.isPositive ? '+' : ''}{formatCurrency(data.variance, currency as any)}
            </p>
            <p className="text-muted-foreground">
              Acumulado: {formatCurrency(data.cumulativeVariance, currency as any)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Estadísticas de resumen
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const totalVariance = totalBudget - totalSpent;
  const positiveMonths = data.filter(item => item.isPositive).length;
  const negativeMonths = data.filter(item => !item.isPositive).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Varianza Mensual {year}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Varianza Total</p>
            <p className={`text-lg font-bold ${totalVariance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance, currency as any)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Meses Positivos</p>
            <p className="text-lg font-bold text-success flex items-center justify-center gap-1">
              {positiveMonths}
              <TrendingUp className="h-4 w-4" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Meses Negativos</p>
            <p className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
              {negativeMonths}
              <TrendingDown className="h-4 w-4" />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Efectividad</p>
            <p className="text-lg font-bold">
              {((positiveMonths / data.length) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Gráfico de Waterfall */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, currency as any)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="variance"
                name="Varianza"
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isPositive 
                      ? 'hsl(var(--success))' 
                      : 'hsl(var(--destructive))'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground space-y-1">
          <p>• Barras verdes: Mes bajo presupuesto (ahorro)</p>
          <p>• Barras rojas: Mes sobre presupuesto (exceso)</p>
          <p>• Haz clic en una barra para ver detalles de ese mes</p>
        </div>
      </CardContent>
    </Card>
  );
};
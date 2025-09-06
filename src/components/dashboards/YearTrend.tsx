import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download } from 'lucide-react';
import { formatCurrency } from '@/types/budget';
import { useState } from 'react';

interface YearTrendData {
  month: string;
  monthNumber: number;
  budget: number;
  spent: number;
  budgetCumulative: number;
  spentCumulative: number;
}

interface YearTrendProps {
  data: YearTrendData[];
  currency: string;
  onMonthClick?: (monthNumber: number, year: number) => void;
  year: number;
}

export const YearTrend = ({ data, currency, onMonthClick, year }: YearTrendProps) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');

  const handlePointClick = (data: any) => {
    if (onMonthClick && data?.monthNumber) {
      onMonthClick(data.monthNumber, year);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Mes', 'Presupuesto', 'Gasto', 'Presupuesto Acumulado', 'Gasto Acumulado'],
      ...data.map(item => [
        item.month,
        item.budget,
        item.spent,
        item.budgetCumulative,
        item.spentCumulative
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tendencia-anual-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value, currency as any)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Tendencia Anual {year}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Mensual
            </Button>
            <Button 
              variant={viewMode === 'cumulative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cumulative')}
            >
              Acumulado
            </Button>
            <Button variant="ghost" size="sm" onClick={exportData}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'monthly' ? (
              <LineChart data={data} onClick={handlePointClick}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Presupuesto"
                />
                <Line 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Gasto"
                />
              </LineChart>
            ) : (
              <AreaChart data={data} onClick={handlePointClick}>
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="budgetCumulative"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.3)"
                  name="Presupuesto Acumulado"
                />
                <Area
                  type="monotone"
                  dataKey="spentCumulative"
                  stackId="2"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive) / 0.3)"
                  name="Gasto Acumulado"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Haz clic en cualquier punto para cambiar al mes correspondiente</p>
          <p>Línea verde: Presupuesto | Línea roja: Gasto real</p>
        </div>
      </CardContent>
    </Card>
  );
};
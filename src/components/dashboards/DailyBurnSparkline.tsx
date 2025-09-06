import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface DailyBurnData {
  day: number;
  date: string;
  actualSpent: number;
  targetSpent: number;
}

interface DailyBurnSparklineProps {
  data: DailyBurnData[];
  currency: string;
  monthBudget: number;
  totalSpent: number;
}

export const DailyBurnSparkline = ({ data, currency, monthBudget, totalSpent }: DailyBurnSparklineProps) => {
  const now = new Date();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyTarget = monthBudget / daysInMonth;
  const todayTarget = dailyTarget * today;
  
  const isAhead = totalSpent < todayTarget;
  const variance = Math.abs(totalSpent - todayTarget);
  const percentageVariance = todayTarget > 0 ? (variance / todayTarget) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">Día {label}</p>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ritmo de Gasto Diario</CardTitle>
          </div>
          <div className={`flex items-center gap-2 ${isAhead ? 'text-success' : 'text-warning'}`}>
            {isAhead ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            <span className="text-sm font-semibold">
              {percentageVariance.toFixed(1)}% {isAhead ? 'por debajo' : 'por encima'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                x={today} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2" 
              />
              <Line
                type="monotone"
                dataKey="targetSpent"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Objetivo"
              />
              <Line
                type="monotone"
                dataKey="actualSpent"
                stroke={isAhead ? "hsl(var(--success))" : "hsl(var(--warning))"}
                strokeWidth={2}
                dot={false}
                name="Real"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Gasto Objetivo Hoy</p>
            <p className="font-semibold">{formatCurrency(todayTarget, currency as any)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Gasto Real</p>
            <p className={`font-semibold ${isAhead ? 'text-success' : 'text-warning'}`}>
              {formatCurrency(totalSpent, currency as any)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Al ritmo actual, {isAhead ? 'terminarás por debajo' : 'excederás'} el presupuesto mensual
        </div>
      </CardContent>
    </Card>
  );
};
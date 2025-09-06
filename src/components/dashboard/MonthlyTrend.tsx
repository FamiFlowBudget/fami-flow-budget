import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Datos de ejemplo para la tendencia (en una app real vendría del hook)
const generateMockData = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return months.map((month, index) => ({
    month,
    presupuesto: 800000 + (Math.random() * 200000),
    gasto: 600000 + (Math.random() * 300000),
  }));
};

// Tooltip personalizado para evitar errores de tipos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-lg shadow-soft">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'presupuesto' ? 'Presupuesto' : 'Gasto Real'}: ${entry.value.toLocaleString('es-CL')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MonthlyTrend = () => {
  const data = generateMockData();

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Tendencia de 6 Meses</h3>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <Tooltip 
              content={<CustomTooltip />}
            />
            <Line 
              type="monotone" 
              dataKey="presupuesto" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="gasto" 
              stroke="hsl(var(--expense))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--expense))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--expense))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-primary rounded"></div>
          <span>Presupuesto</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-expense rounded"></div>
          <span>Gasto Real</span>
        </div>
      </div>
    </Card>
  );
};
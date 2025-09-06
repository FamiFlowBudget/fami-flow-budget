import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

// Datos de ejemplo para la tendencia
const generateMockData = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return months.map((month, index) => ({
    month,
    presupuesto: 800000 + (Math.random() * 200000),
    gasto: 600000 + (Math.random() * 300000),
  }));
};

// Componente de gráfico simple con CSS (alternativa a Recharts)
const SimpleLineChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.flatMap(d => [d.presupuesto, d.gasto]));
  
  return (
    <div className="relative h-64 border rounded-lg p-4 bg-muted/10">
      <div className="absolute inset-4">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-6 border-l border-border/30">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="border-r border-border/30 relative">
              <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                {data[i]?.month}
              </span>
            </div>
          ))}
        </div>
        
        {/* Data visualization */}
        <svg className="w-full h-full" viewBox="0 0 300 200">
          {/* Presupuesto line */}
          <polyline
            points={data.map((d, i) => `${(i * 50) + 25},${200 - (d.presupuesto / maxValue) * 180}`).join(' ')}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
          {/* Gasto line */}
          <polyline
            points={data.map((d, i) => `${(i * 50) + 25},${200 - (d.gasto / maxValue) * 180}`).join(' ')}
            fill="none"
            stroke="hsl(var(--expense))"
            strokeWidth="3"
          />
          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={(i * 50) + 25}
                cy={200 - (d.presupuesto / maxValue) * 180}
                r="4"
                fill="hsl(var(--primary))"
              />
              <circle
                cx={(i * 50) + 25}
                cy={200 - (d.gasto / maxValue) * 180}
                r="4"
                fill="hsl(var(--expense))"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
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

      <SimpleLineChart data={data} />

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
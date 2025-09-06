import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { PieChart as PieChartIcon, Download } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

interface DonutDistributionProps {
  data: CategoryDistribution[];
  currency: string;
  title?: string;
  onCategoryClick?: (categoryId: string) => void;
}

export const DonutDistribution = ({ 
  data, 
  currency, 
  title = "Distribución por Categoría",
  onCategoryClick 
}: DonutDistributionProps) => {

  // Agrupar categorías pequeñas (<3%) en "Otros"
  const threshold = 3;
  const mainCategories = data.filter(item => item.percentage >= threshold);
  const otherCategories = data.filter(item => item.percentage < threshold);
  
  const chartData = [...mainCategories];
  
  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce((sum, item) => sum + item.amount, 0);
    const otherPercentage = otherCategories.reduce((sum, item) => sum + item.percentage, 0);
    
    chartData.push({
      categoryId: 'others',
      categoryName: `Otros (${otherCategories.length})`,
      amount: otherTotal,
      percentage: otherPercentage,
      color: 'hsl(var(--muted-foreground))'
    });
  }

  // Colores predeterminados si no se proporcionan
  const defaultColors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(158 64% 70%)',
    'hsl(217 91% 70%)',
    'hsl(38 92% 70%)',
    'hsl(0 84% 70%)',
  ];

  const dataWithColors = chartData.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }));

  const handleClick = (data: any) => {
    if (data.categoryId !== 'others' && onCategoryClick) {
      onCategoryClick(data.categoryId);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Categoría', 'Monto', 'Porcentaje'],
      ...data.map(item => [
        item.categoryName,
        item.amount,
        item.percentage
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'distribucion-categorias.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{data.categoryName}</p>
          <p className="text-sm">
            Monto: {formatCurrency(data.amount, currency as any)}
          </p>
          <p className="text-sm">
            Porcentaje: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // No mostrar etiquetas para segmentos muy pequeños
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="amount"
                onClick={handleClick}
                className="cursor-pointer"
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${value} (${(entry.payload as any)?.percentage?.toFixed(1)}%)`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Distribución del gasto total por categoría</p>
          <p>Haz clic en un segmento para filtrar por esa categoría</p>
          {otherCategories.length > 0 && (
            <p className="text-xs">
              Categorías menores al {threshold}% agrupadas en "Otros"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Download } from 'lucide-react';
import { formatCurrency } from '@/types/budget';

interface HeatmapData {
  categoryId: string;
  categoryName: string;
  monthlyData: {
    month: number;
    monthName: string;
    budget: number;
    spent: number;
    percentage: number;
    status: 'success' | 'warning' | 'danger';
  }[];
}

interface CategoryMonthHeatmapProps {
  data: HeatmapData[];
  currency: string;
  year: number;
  onCellClick?: (categoryId: string, month: number) => void;
}

export const CategoryMonthHeatmap = ({ 
  data, 
  currency, 
  year, 
  onCellClick 
}: CategoryMonthHeatmapProps) => {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const getIntensityColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted/30';
    if (percentage <= 50) return 'bg-success/20';
    if (percentage <= 75) return 'bg-success/40';
    if (percentage <= 90) return 'bg-warning/40';
    if (percentage <= 100) return 'bg-warning/60';
    if (percentage <= 110) return 'bg-destructive/40';
    return 'bg-destructive/60';
  };

  const getTextColor = (percentage: number) => {
    if (percentage === 0) return 'text-muted-foreground';
    if (percentage <= 90) return 'text-foreground';
    return 'text-destructive-foreground';
  };

  const exportData = () => {
    const csvContent = [
      ['Categoría', 'Mes', 'Presupuesto', 'Gasto', 'Porcentaje'],
      ...data.flatMap(category => 
        category.monthlyData.map(month => [
          category.categoryName,
          month.monthName,
          month.budget,
          month.spent,
          month.percentage
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmap-categorias-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ categoryName, monthData }: { 
    categoryName: string; 
    monthData: HeatmapData['monthlyData'][0] 
  }) => (
    <div className="absolute z-10 bg-background border border-border rounded-lg p-3 shadow-lg pointer-events-none">
      <p className="font-medium text-sm">{categoryName}</p>
      <p className="text-sm">{monthData.monthName}</p>
      <div className="text-xs space-y-1 mt-1">
        <p>Presupuesto: {formatCurrency(monthData.budget, currency as any)}</p>
        <p>Gasto: {formatCurrency(monthData.spent, currency as any)}</p>
        <p className={`font-semibold ${
          monthData.percentage <= 100 ? 'text-success' : 'text-destructive'
        }`}>
          Uso: {monthData.percentage.toFixed(1)}%
        </p>
        <p>Varianza: {formatCurrency(monthData.budget - monthData.spent, currency as any)}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <CardTitle>Mapa de Calor {year}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Leyenda */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span>Intensidad de uso:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-success/20 rounded-sm"></div>
              <span>0-50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-success/40 rounded-sm"></div>
              <span>50-75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-warning/40 rounded-sm"></div>
              <span>75-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-warning/60 rounded-sm"></div>
              <span>90-100%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-destructive/40 rounded-sm"></div>
              <span>&gt;100%</span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header con meses */}
            <div className="grid grid-cols-13 gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground">Categoría</div>
              {months.map((month, index) => (
                <div key={month} className="text-xs font-medium text-center text-muted-foreground">
                  {month}
                </div>
              ))}
            </div>

            {/* Filas de categorías */}
            <div className="space-y-1">
              {data.map((category) => (
                <div key={category.categoryId} className="grid grid-cols-13 gap-1">
                  {/* Nombre de categoría */}
                  <div className="text-xs font-medium truncate pr-2 flex items-center">
                    {category.categoryName}
                  </div>
                  
                  {/* Celdas de meses */}
                  {months.map((_, monthIndex) => {
                    const monthData = category.monthlyData.find(m => m.month === monthIndex + 1);
                    const percentage = monthData?.percentage || 0;
                    
                    return (
                      <div
                        key={monthIndex}
                        className={`
                          relative group h-8 flex items-center justify-center rounded-sm cursor-pointer
                          ${getIntensityColor(percentage)}
                          hover:ring-2 hover:ring-primary/50 transition-all
                        `}
                        onClick={() => monthData && onCellClick?.(category.categoryId, monthIndex + 1)}
                      >
                        <span className={`text-xs font-semibold ${getTextColor(percentage)}`}>
                          {percentage > 0 ? `${Math.round(percentage)}%` : ''}
                        </span>
                        
                        {/* Tooltip */}
                        {monthData && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <CustomTooltip 
                              categoryName={category.categoryName}
                              monthData={monthData}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>• Las celdas más intensas indican mayor uso del presupuesto</p>
          <p>• Haz clic en una celda para filtrar por categoría y mes</p>
        </div>
      </CardContent>
    </Card>
  );
};
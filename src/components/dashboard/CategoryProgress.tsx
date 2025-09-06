import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BudgetProgress, formatCurrency } from '@/types/budget';
import { 
  Home, ShoppingCart, Car, GraduationCap, Heart, Shield, 
  Gamepad2, Shirt, PiggyBank, AlertTriangle 
} from 'lucide-react';

interface CategoryProgressProps {
  categories: BudgetProgress[];
}

// Mapeo de iconos por nombre de categoría
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, any> = {
    'Hogar': Home,
    'Alimentación': ShoppingCart,
    'Transporte': Car,
    'Educación': GraduationCap,
    'Salud': Heart,
    'Seguros': Shield,
    'Entretenimiento': Gamepad2,
    'Ropa': Shirt,
    'Ahorro': PiggyBank,
    'Imprevistos': AlertTriangle,
  };
  
  return iconMap[categoryName] || AlertTriangle;
};

export const CategoryProgress = ({ categories }: CategoryProgressProps) => {
  if (categories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">
          <Target className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <h3 className="font-semibold mb-2">No hay presupuestos definidos</h3>
          <p className="text-sm">Define presupuestos por categoría para ver el progreso</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Progreso por Categoría</h3>
      <div className="space-y-4">
        {categories.map((category) => {
          const IconComponent = getCategoryIcon(category.categoryName);
          
          return (
            <div key={category.categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${{
                    success: 'bg-success/10 text-success',
                    warning: 'bg-warning/10 text-warning', 
                    danger: 'bg-destructive/10 text-destructive'
                  }[category.status]}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{category.categoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(category.spentAmount)} de {formatCurrency(category.budgetAmount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${{
                    success: 'text-success',
                    warning: 'text-warning', 
                    danger: 'text-destructive'
                  }[category.status]}`}>
                    {category.percentage.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(category.budgetAmount - category.spentAmount)} disponible
                  </p>
                </div>
              </div>
              
              <Progress 
                value={Math.min(category.percentage, 100)}
                className={`h-2 ${{
                  success: 'progress-success',
                  warning: 'progress-warning',
                  danger: 'progress-danger'
                }[category.status]}`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Componente Target para el estado vacío (añadir import)
const Target = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);
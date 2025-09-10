import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BudgetProgress, formatCurrency } from '@/types/budget';
import { Target, Eye } from 'lucide-react';
import { getCategoryIconByName } from '@/lib/icons';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

interface CategoryProgressProps {
  categories: BudgetProgress[];
  onCategoryClick?: (categoryId: string) => void;
  showAll?: boolean;
}

export const CategoryProgress = ({ categories, onCategoryClick, showAll: initialShowAll = false }: CategoryProgressProps) => {
  const { categories: allCategories } = useBudgetSupabase();
  const [showAll, setShowAll] = useState(initialShowAll);
  const displayCategories = showAll ? categories : categories.slice(0, 6);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progreso por Categoría</CardTitle>
          {!showAll && categories.length > 6 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAll(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver todas
            </Button>
          )}
          {showAll && categories.length > 6 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAll(false)}
            >
              Ver menos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayCategories.map((category) => {
          const IconComponent = getCategoryIconByName(category.categoryName, allCategories);
          
          return (
            <div 
              key={category.categoryId} 
              className="space-y-2 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
              onClick={() => onCategoryClick?.(category.categoryId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    category.status === 'success' ? 'bg-success/10 text-success' :
                    category.status === 'warning' ? 'bg-warning/10 text-warning' : 
                    'bg-destructive/10 text-destructive'
                  }`}>
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
                  <span className={`text-sm font-bold ${
                    category.status === 'success' ? 'text-success' :
                    category.status === 'warning' ? 'text-warning' : 
                    'text-destructive'
                  }`}>
                    {category.percentage.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(category.budgetAmount - category.spentAmount)} disponible
                  </p>
                </div>
              </div>
              
              <Progress 
                value={Math.min(category.percentage, 100)}
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
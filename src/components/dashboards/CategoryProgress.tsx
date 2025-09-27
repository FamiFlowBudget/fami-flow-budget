// src/components/dashboards/CategoryProgress.tsx (Versión Jerárquica)

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/types/budget';
import { Target, Eye, ChevronRight, ChevronDown } from 'lucide-react';
import { getCategoryIconById } from '@/lib/icons';
import { useBudgetSupabase, HierarchicalBudgetProgress } from '@/hooks/useBudgetSupabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils"; // Importamos una utilidad para clases condicionales

interface CategoryProgressProps {
  categories: HierarchicalBudgetProgress[];
  onCategoryClick?: (categoryId: string) => void;
  showAll?: boolean;
  isLoading?: boolean;
}

const ProgressBar = ({ progress, status }: { progress: number; status: string }) => (
  <Progress 
    value={Math.min(progress, 100)} 
    className={cn("h-2", {
      "bg-success/20": status === 'success',
      "bg-warning/20": status === 'warning',
      "bg-destructive/20": status === 'danger',
    })} 
    indicatorClassName={cn({
      "bg-success": status === 'success',
      "bg-warning": status === 'warning',
      "bg-destructive": status === 'danger',
    })}
  />
);

export const CategoryProgress = ({ categories, onCategoryClick, showAll: initialShowAll = false, isLoading }: CategoryProgressProps) => {
  const { categories: allCategories } = useBudgetSupabase();
  const [showAll, setShowAll] = useState(initialShowAll);
  const displayCategories = showAll ? categories : categories.slice(0, 5);

  if (isLoading) {
    // Podríamos añadir un skeleton aquí más adelante
    return <Card className="p-6 text-center"><p>Cargando progreso...</p></Card>;
  }

  if (categories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">
          <Target className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <h3 className="font-semibold mb-2">No hay presupuestos definidos</h3>
          <p className="text-sm">Define presupuestos para ver tu progreso aquí.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progreso por Categoría</CardTitle>
          {/* Lógica para mostrar/ocultar no cambia */}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayCategories.map((category) => {
          const IconComponent = getCategoryIconById(category.categoryId, allCategories);
          
          return (
            <Collapsible key={category.categoryId} className="space-y-2">
              {/* Categoría Principal */}
              <CollapsibleTrigger className="w-full p-3 rounded-lg hover:bg-muted/50 transition-colors flex flex-col space-y-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {category.subcategories.length > 0 && <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />}
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-left">{category.categoryName}</p>
                      <p className="text-xs text-muted-foreground text-left">
                        {formatCurrency(category.spentAmount)} / {formatCurrency(category.budgetAmount)}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold", {
                    'text-success': category.status === 'success',
                    'text-warning': category.status === 'warning',
                    'text-destructive': category.status === 'danger'
                  })}>
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar progress={category.percentage} status={category.status} />
              </CollapsibleTrigger>
              
              {/* Subcategorías */}
              <CollapsibleContent className="pl-6 space-y-3 pt-2">
                {category.subcategories.map(sub => (
                  <div key={sub.categoryId} className="flex flex-col space-y-2">
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center space-x-3">
                         <div className="w-6" /> {/* Espaciador para alinear */}
                         <div>
                           <p className="font-medium text-xs text-left">{sub.categoryName}</p>
                           <p className="text-xs text-muted-foreground text-left">
                             {formatCurrency(sub.spentAmount)} / {formatCurrency(sub.budgetAmount)}
                           </p>
                         </div>
                       </div>
                       <span className={cn("text-xs font-bold", {
                         'text-success': sub.status === 'success',
                         'text-warning': sub.status === 'warning',
                         'text-destructive': sub.status === 'danger'
                       })}>
                         {sub.percentage.toFixed(1)}%
                       </span>
                     </div>
                     <ProgressBar progress={sub.percentage} status={sub.status} />
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BudgetProgress, formatCurrency } from '@/types/budget';
import { getCategoryIconByName } from '@/lib/icons';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryProgressProps {
  categories: BudgetProgress[];
}

// Componente Target para el estado vacío
const Target = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const CategoryProgress = ({ categories }: CategoryProgressProps) => {
  const { categories: allCategories, getCategoryProgressHierarchical } = useBudgetSupabase();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Usar datos jerárquicos para el dashboard
  const hierarchicalData = getCategoryProgressHierarchical();
  
  // Determinar si una categoría debe estar automáticamente expandida
  // (si alguna subcategoría está en estado de peligro)
  const categoriesWithDangerSubcats = new Set(
    hierarchicalData
      .filter(cat => cat.subcategories.some(sub => sub.status === 'danger'))
      .map(cat => cat.categoryId)
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (hierarchicalData.length === 0) {
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
         {hierarchicalData.map((category) => {
           const IconComponent = getCategoryIconByName(category.categoryName, allCategories);
           const isExpanded = expandedCategories.has(category.categoryId);
           const hasSubcategories = category.subcategories.length > 0;
           
           // Determinar si hay subcategorías en peligro o advertencia
           const hasSubcategoryInDanger = category.subcategories.some(sub => sub.status === 'danger');
           const hasSubcategoryInWarning = category.subcategories.some(sub => sub.status === 'warning');
           
           // Ajustar el status de la categoría principal si hay subcategorías problemáticas
           let displayStatus = category.status;
           if (hasSubcategoryInDanger) {
             displayStatus = 'danger';
           } else if (hasSubcategoryInWarning && category.status === 'success') {
             displayStatus = 'warning';
           }
           
           return (
             <div key={category.categoryId} className="space-y-2">
               {/* Categoría Principal */}
               <div 
                 className={`space-y-2 hover:bg-muted/50 p-3 rounded-lg transition-colors ${hasSubcategories ? 'cursor-pointer' : ''}`}
                 onClick={hasSubcategories ? () => toggleCategory(category.categoryId) : undefined}
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     {hasSubcategories && (
                       <div className="flex items-center">
                         {isExpanded ? (
                           <ChevronDown className="h-4 w-4 text-muted-foreground" />
                         ) : (
                           <ChevronRight className="h-4 w-4 text-muted-foreground" />
                         )}
                       </div>
                     )}
                     <div className={`p-2 rounded-lg transition-colors ${{
                       success: 'bg-success/10 text-success',
                       warning: 'bg-warning/10 text-warning', 
                       danger: 'bg-destructive/10 text-destructive'
                     }[displayStatus]}`}>
                       <IconComponent className="h-4 w-4" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <p className="font-medium text-sm">{category.categoryName}</p>
                         {hasSubcategories && (hasSubcategoryInDanger || hasSubcategoryInWarning) && (
                           <div className={`w-2 h-2 rounded-full ${{
                             danger: 'bg-destructive',
                             warning: 'bg-warning'
                           }[hasSubcategoryInDanger ? 'danger' : 'warning']}`} 
                           title={`${hasSubcategoryInDanger ? 'Subcategoría excedida' : 'Subcategoría cerca del límite'}`} />
                         )}
                       </div>
                       <p className="text-xs text-muted-foreground">
                         {formatCurrency(category.spentAmount)} de {formatCurrency(category.budgetAmount)}
                         {hasSubcategories && ` (${category.subcategories.length} subcategorías)`}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <span className={`text-sm font-bold ${{
                       success: 'text-success',
                       warning: 'text-warning', 
                       danger: 'text-destructive'
                     }[displayStatus]}`}>
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
                   }[displayStatus]}`}
                 />
               </div>

              {/* Subcategorías expandidas */}
              {isExpanded && hasSubcategories && (
                <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
                  {category.subcategories.map((subcategory) => {
                    const SubIconComponent = getCategoryIconByName(subcategory.categoryName, allCategories);
                    
                    return (
                      <div key={subcategory.categoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${{
                              success: 'bg-success/10 text-success',
                              warning: 'bg-warning/10 text-warning', 
                              danger: 'bg-destructive/10 text-destructive'
                            }[subcategory.status]}`}>
                              <SubIconComponent className="h-3 w-3" />
                            </div>
                            <div>
                              <p className="font-medium text-xs">{subcategory.categoryName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(subcategory.spentAmount)} de {formatCurrency(subcategory.budgetAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold ${{
                              success: 'text-success',
                              warning: 'text-warning', 
                              danger: 'text-destructive'
                            }[subcategory.status]}`}>
                              {subcategory.percentage.toFixed(1)}%
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(subcategory.budgetAmount - subcategory.spentAmount)} disponible
                            </p>
                          </div>
                        </div>
                        
                        <Progress 
                          value={Math.min(subcategory.percentage, 100)}
                          className={`h-1.5 ${{
                            success: 'progress-success',
                            warning: 'progress-warning',
                            danger: 'progress-danger'
                          }[subcategory.status]}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
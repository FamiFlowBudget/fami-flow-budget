import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Calendar, User, DollarSign, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import { usePeriod } from '@/providers/PeriodProvider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCategoryIconById } from '@/lib/icons';

interface MonthlyBudgetViewProps {
  selectedMembers: string[];
  onEditBudget: (categoryId: string, memberId: string, existingBudget?: any) => void;
  onDeleteBudget?: (budgetId: string, categoryName: string, memberName: string) => void;
}

export const MonthlyBudgetView = ({ selectedMembers, onEditBudget, onDeleteBudget }: MonthlyBudgetViewProps) => {
  const { budgets, categories, members, currentMember } = useBudgetSupabase();
  const { period } = usePeriod();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filtrar presupuestos por período actual
  const periodBudgets = budgets.filter(b => 
    b.year === period.year && 
    b.month === period.month
  );

  // Organizar presupuestos por categoría y miembro con soporte para subcategorías
  const organizedBudgets = categories.filter(cat => !cat.parentId).map(category => {
    const subcategories = categories.filter(sub => sub.parentId === category.id);
    
    // Presupuestos de la categoría principal
    const categoryBudgets = periodBudgets.filter(b => b.categoryId === category.id);
    
    // Presupuestos de subcategorías
    const subcategoryBudgets = subcategories.flatMap(sub => 
      periodBudgets.filter(b => b.categoryId === sub.id)
    );
    
    // Todos los presupuestos relacionados (categoría principal + subcategorías)
    const allRelatedBudgets = [...categoryBudgets, ...subcategoryBudgets];

    const memberBudgets = members
      .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
      .map(member => {
        // Sumar presupuesto de categoría principal + subcategorías para este miembro
        const memberMainBudget = categoryBudgets.find(b => b.memberId === member.id);
        const memberSubBudgets = subcategoryBudgets.filter(b => b.memberId === member.id);
        const totalAmount = (memberMainBudget?.amount || 0) + 
                           memberSubBudgets.reduce((sum, b) => sum + b.amount, 0);
        
        return {
          member,
          budget: memberMainBudget, // Para compatibilidad
          amount: totalAmount,
          mainCategoryAmount: memberMainBudget?.amount || 0,
          subcategoryBudgets: memberSubBudgets
        };
      });

    const familyTotal = memberBudgets.reduce((sum, mb) => sum + mb.amount, 0);
    
    // Agregar detalles de subcategorías
    const subcategoryDetails = subcategories.map(sub => {
      const subBudgets = periodBudgets.filter(b => b.categoryId === sub.id);
      const subMemberBudgets = members
        .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
        .map(member => {
          const memberSubBudget = subBudgets.find(b => b.memberId === member.id);
          return {
            member,
            budget: memberSubBudget,
            amount: memberSubBudget?.amount || 0
          };
        });
      
      const subTotal = subMemberBudgets.reduce((sum, mb) => sum + mb.amount, 0);
      
      return {
        subcategory: sub,
        memberBudgets: subMemberBudgets,
        total: subTotal,
        hasData: subTotal > 0
      };
    });

    return {
      category,
      memberBudgets,
      familyTotal,
      hasData: familyTotal > 0 || memberBudgets.length > 0,
      subcategoryDetails: subcategoryDetails.filter(sub => sub.hasData)
    };
  }).filter(cb => cb.hasData);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vista Mensual - {new Date(period.year, period.month - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </CardTitle>
        <CardDescription>
          Presupuestos por categoría con desglose familiar y subcategorías
        </CardDescription>
      </CardHeader>
      <CardContent>
        {organizedBudgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay presupuestos configurados para este período</p>
            <p className="text-sm">Crea presupuestos para cada miembro de la familia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {organizedBudgets.map((categoryData) => {
              const IconComponent = getCategoryIconById(categoryData.category.id, categories);
              
              return (
                <Collapsible
                  key={categoryData.category.id}
                  open={expandedCategories.has(categoryData.category.id)}
                  onOpenChange={() => toggleCategory(categoryData.category.id)}
                >
                  <div className="border rounded-lg">
                    {/* Header de categoría con total familiar */}
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(categoryData.category.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium">{categoryData.category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {categoryData.memberBudgets.filter(mb => mb.amount > 0).length} miembro(s)
                            {categoryData.subcategoryDetails.length > 0 && (
                              <span> • {categoryData.subcategoryDetails.length} subcategoría(s)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(categoryData.familyTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Familia</p>
                      </div>
                    </CollapsibleTrigger>

                    {/* Desglose por miembros y subcategorías */}
                    <CollapsibleContent>
                      <div className="border-t bg-accent/20">
                        {/* Presupuesto de categoría principal por miembro */}
                        {categoryData.memberBudgets.some(mb => mb.mainCategoryAmount > 0) && (
                          <div className="p-3 border-b bg-accent/10">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Categoría Principal</h4>
                            {categoryData.memberBudgets
                              .filter(mb => mb.mainCategoryAmount > 0)
                              .map((memberBudget) => (
                                <div 
                                  key={`main-${memberBudget.member.id}`}
                                  className="p-2 flex items-center justify-between hover:bg-accent/30 transition-colors rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{memberBudget.member.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {memberBudget.member.role}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {formatCurrency(memberBudget.mainCategoryAmount)}
                                    </span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => onEditBudget(
                                        categoryData.category.id, 
                                        memberBudget.member.id, 
                                        memberBudget.budget
                                      )}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        
                        {/* Subcategorías */}
                        {categoryData.subcategoryDetails.map((subDetail) => (
                          <div key={subDetail.subcategory.id} className="p-3 border-b last:border-b-0">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <span className="text-muted-foreground">└</span>
                              {subDetail.subcategory.name}
                              <Badge variant="outline" className="text-xs">{formatCurrency(subDetail.total)}</Badge>
                            </h4>
                            {subDetail.memberBudgets
                              .filter(mb => mb.amount > 0)
                              .map((memberBudget) => (
                                <div 
                                  key={`sub-${memberBudget.member.id}`}
                                  className="p-2 ml-4 flex items-center justify-between hover:bg-accent/30 transition-colors rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{memberBudget.member.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {memberBudget.member.role}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {formatCurrency(memberBudget.amount)}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => onEditBudget(
                                          subDetail.subcategory.id, 
                                          memberBudget.member.id, 
                                          memberBudget.budget
                                        )}
                                      >
                                        {memberBudget.amount > 0 ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                      </Button>
                                      {currentMember?.role === 'admin' && memberBudget.budget && onDeleteBudget && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el presupuesto de {formatCurrency(memberBudget.amount)} para {memberBudget.member.name} en {subDetail.subcategory.name}.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => onDeleteBudget(memberBudget.budget.id, subDetail.subcategory.name, memberBudget.member.name)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {/* Botón para agregar presupuesto a subcategoría para miembros sin presupuesto */}
                            {subDetail.memberBudgets.filter(mb => mb.amount === 0).length > 0 && (
                              <div className="ml-4 mt-2">
                                <div className="text-xs text-muted-foreground mb-1">Agregar presupuesto:</div>
                                <div className="flex flex-wrap gap-1">
                                  {subDetail.memberBudgets
                                    .filter(mb => mb.amount === 0)
                                    .map((memberBudget) => (
                                      <Button
                                        key={`add-${memberBudget.member.id}`}
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => onEditBudget(
                                          subDetail.subcategory.id,
                                          memberBudget.member.id,
                                          null
                                        )}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {memberBudget.member.name}
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Botón para agregar presupuesto a categoría principal para miembros sin presupuesto */}
                        {categoryData.memberBudgets.filter(mb => mb.mainCategoryAmount === 0).length > 0 && (
                          <div className="p-3 border-b last:border-b-0 bg-accent/5">
                            <div className="text-xs text-muted-foreground mb-2">Agregar presupuesto a categoría principal:</div>
                            <div className="flex flex-wrap gap-1">
                              {categoryData.memberBudgets
                                .filter(mb => mb.mainCategoryAmount === 0)
                                .map((memberBudget) => (
                                  <Button
                                    key={`add-main-${memberBudget.member.id}`}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => onEditBudget(
                                      categoryData.category.id,
                                      memberBudget.member.id,
                                      null
                                    )}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    {memberBudget.member.name}
                                  </Button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
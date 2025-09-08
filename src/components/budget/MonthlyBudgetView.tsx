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

  // Organizar presupuestos por categoría y miembro
  const organizedBudgets = categories.map(category => {
    const categoryBudgets = periodBudgets.filter(b => b.categoryId === category.id);

    const memberBudgets = members
      .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
      .map(member => {
        const memberBudget = categoryBudgets.find(b => b.memberId === member.id);
        return {
          member,
          budget: memberBudget,
          amount: memberBudget?.amount || 0
        };
      });

    const familyTotal = memberBudgets.reduce((sum, mb) => sum + mb.amount, 0);

    return {
      category,
      memberBudgets,
      familyTotal,
      hasData: familyTotal > 0 || memberBudgets.length > 0
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
          Presupuestos por categoría con desglose familiar
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

                    {/* Desglose por miembros */}
                    <CollapsibleContent>
                      <div className="border-t bg-accent/20">
                        {categoryData.memberBudgets.map((memberBudget) => (
                          <div 
                            key={memberBudget.member.id}
                            className="p-3 border-b last:border-b-0 flex items-center justify-between hover:bg-accent/30 transition-colors"
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
                                    categoryData.category.id, 
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
                                          Esta acción eliminará el presupuesto de {formatCurrency(memberBudget.amount)} para {memberBudget.member.name} en {categoryData.category.name}.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => onDeleteBudget(memberBudget.budget.id, categoryData.category.name, memberBudget.member.name)}
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
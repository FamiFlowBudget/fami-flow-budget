import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Receipt, User, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { NewExpenseButton } from '@/components/NewExpenseButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export const ExpenseManagement = () => {
  const { expenses, categories, members, currentMember, loading, deleteExpense } = useBudgetSupabase();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { toast } = useToast();

  const handleDeleteExpense = async (expenseId: string, description: string) => {
    if (currentMember?.role !== 'admin') {
      toast({
        title: "No autorizado",
        description: "Solo los administradores pueden eliminar gastos",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteExpense(expenseId);
      toast({
        title: "Gasto eliminado",
        description: `Se eliminó el gasto: ${description}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      });
    }
  };

  const organizedExpenses = categories.map(category => {
    const categoryExpenses = expenses.filter(e => e.categoryId === category.id);
    
    const memberExpenses = members.map(member => {
      const memberExpensesList = categoryExpenses.filter(e => e.memberId === member.id);
      const totalAmount = memberExpensesList.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        member,
        expenses: memberExpensesList,
        totalAmount
      };
    }).filter(me => me.expenses.length > 0);

    const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      category,
      memberExpenses,
      categoryTotal,
      hasData: categoryExpenses.length > 0
    };
  }).filter(ce => ce.hasData);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Gastos</h1>
          <p className="text-muted-foreground mt-2">
            Gastos organizados por categoría con desglose familiar
          </p>
        </div>
        <NewExpenseButton />
      </div>

      {organizedExpenses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay gastos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {organizedExpenses.map((categoryData) => (
            <Collapsible
              key={categoryData.category.id}
              open={expandedCategories.has(categoryData.category.id)}
              onOpenChange={() => toggleCategory(categoryData.category.id)}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(categoryData.category.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          {getIconComponent(categoryData.category.icon)}
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{categoryData.category.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {categoryData.memberExpenses.length} miembro(s) con gastos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(categoryData.categoryTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {categoryData.memberExpenses.map((memberData) => (
                        <div key={memberData.member.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{memberData.member.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {memberData.member.role}
                              </Badge>
                            </div>
                            <span className="font-bold">
                              {formatCurrency(memberData.totalAmount)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {memberData.expenses.slice(0, 5).map((expense) => (
                              <div key={expense.id} className="flex items-center justify-between text-sm group">
                                <div className="flex-1">
                                  <p className="font-medium">{expense.description}</p>
                                  <p className="text-muted-foreground">
                                    {expense.merchant} • {new Date(expense.date).toLocaleDateString('es-CL')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {formatCurrency(expense.amount)}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingExpense({
                                        id: expense.id,
                                        amount: expense.amount,
                                        categoryId: expense.categoryId,
                                        description: expense.description,
                                        merchant: expense.merchant,
                                        paymentMethod: expense.paymentMethod,
                                        date: expense.date,
                                        memberId: expense.memberId
                                      })}
                                      className="p-1 h-auto"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    {currentMember?.role === 'admin' && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="p-1 h-auto text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción no se puede deshacer. Se eliminará permanentemente el gasto "{expense.description}".
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleDeleteExpense(expense.id, expense.description)}
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
                            {memberData.expenses.length > 5 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{memberData.expenses.length - 5} gastos más
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {editingExpense && (
        <ExpenseFormDialog
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expenseToEdit={editingExpense}
        />
      )}
    </div>
  );
};
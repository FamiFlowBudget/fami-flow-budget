// src/components/expenses/ExpenseManagement.tsx (Versión Final con Skeletons)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Receipt, User, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { NewExpenseButton } from '@/components/NewExpenseButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { getCategoryIconById } from '@/lib/icons';
import { getCategoryPath } from '@/utils/categoryUtils';
import { ExpenseManagementSkeleton } from "./ExpenseManagementSkeleton"; // <<<--- IMPORTAMOS EL SKELETON

export const ExpenseManagement = () => {
  const { expenses, categories, members, currentMember, loading, deleteExpense } = useBudgetSupabase();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { toast } = useToast();

  const handleDeleteExpense = async (expenseId: string, description: string) => {
    try {
      await deleteExpense(expenseId);
      toast({
        title: "Gasto eliminado",
        description: `El gasto "${description}" ha sido eliminado.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto.",
        variant: "destructive",
      });
    }
  };

  const organizedExpenses = categories ? categories.map(category => {
    const categoryExpenses = expenses?.filter(e => e.categoryId === category.id) || [];
    const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const memberTotals = members?.map(member => {
      const memberExpenses = categoryExpenses.filter(e => e.memberId === member.id);
      return {
        member,
        total: memberExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: memberExpenses.length,
      };
    }).filter(m => m.count > 0);

    return {
      category,
      categoryTotal,
      expenses: categoryExpenses,
      memberTotals,
      hasData: categoryExpenses.length > 0,
    };
  }).filter(ce => ce.hasData) : [];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

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

      {loading ? (
        <ExpenseManagementSkeleton />
      ) : organizedExpenses.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-8 text-center flex flex-col items-center gap-4">
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <CardTitle>Empieza a registrar tus gastos</CardTitle>
              <CardDescription>
                Parece que aún no has añadido ningún gasto. ¡Haz clic abajo para registrar el primero!
              </CardDescription>
            </div>
            <NewExpenseButton />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {organizedExpenses.map((categoryData) => {
            const IconComponent = getCategoryIconById(categoryData.category.id, categories);
            return (
              <Collapsible key={categoryData.category.id} open={expandedCategories.has(categoryData.category.id)} onOpenChange={() => toggleCategory(categoryData.category.id)}>
                <CollapsibleTrigger asChild>
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        {expandedCategories.has(categoryData.category.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        <IconComponent className="w-6 h-6" />
                        <div className="flex-grow">
                          <CardTitle className="text-lg">{categoryData.category.name}</CardTitle>
                          <CardDescription>{getCategoryPath(categoryData.category.id, categories)}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(categoryData.categoryTotal)}</p>
                        <p className="text-sm text-muted-foreground">{categoryData.expenses.length} transacciones</p>
                      </div>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-8 pr-4 py-2 space-y-4">
                    {categoryData.expenses.map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <p className="font-semibold">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                        <div className="w-1/4 text-center">
                          <Badge variant="outline" className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {members?.find(m => m.id === expense.memberId)?.name || 'Miembro desconocido'}
                          </Badge>
                        </div>
                        <div className="w-1/4 text-right">
                          <p className="font-medium">{formatCurrency(expense.amount)}</p>
                        </div>
                        <div className="w-auto pl-4 flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingExpense(expense)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el gasto
                                  <span className="font-bold"> "{expense.description}"</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteExpense(expense.id, expense.description)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {editingExpense && (
        <ExpenseFormDialog isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} expenseToEdit={editingExpense} />
      )}
    </div>
  );
};

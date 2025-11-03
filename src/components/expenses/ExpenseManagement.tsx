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
import { ExpenseManagementSkeleton } from "./ExpenseManagementSkeleton";

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
        description: `El gasto "${description}" ha sido eliminado correctamente.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error al eliminar el gasto",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

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

  const organizedExpenses = categories
    .map(category => {
      // Filtrar gastos para la categoría actual
      const expensesForCategory = expenses.filter(
        e => e.category_id === category.id
      );

      // Calcular el total
      const total = expensesForCategory.reduce((sum, e) => sum + e.amount, 0);

      // Agrupar gastos por miembro de la familia
      const expensesByMember = members.map(member => {
        const memberExpenses = expensesForCategory.filter(e => e.user_id === member.id);
        const memberTotal = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          member,
          expenses: memberExpenses,
          total: memberTotal,
          hasData: memberExpenses.length > 0,
        };
      }).filter(mb => mb.hasData);

      return {
        category,
        total,
        expensesByMember,
        hasData: expensesForCategory.length > 0,
      };
    })
    .filter(ce => ce.hasData);

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
                <CollapsibleTrigger className="w-full">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${'bg-slate-100'}`}>
                            <IconComponent className={`w-6 h-6 ${'text-slate-800'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-left">{categoryData.category.name}</CardTitle>
                            <CardDescription className="text-left">
                              {getCategoryPath(categoryData.category.id, categories)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xl font-bold">{formatCurrency(categoryData.total, 'CLP')}</p>
                            <p className="text-sm text-muted-foreground">de {categoryData.expensesByMember.reduce((acc, member) => acc + member.expenses.length, 0)} gastos</p>
                          </div>
                          {expandedCategories.has(categoryData.category.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </CardHeader>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="border-t-0 rounded-t-none">
                      <CardContent className="p-4 space-y-4">
                        {categoryData.expensesByMember.map(({ member, expenses: memberExpenses, total }) => (
                          <div key={member.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{member.name || `Miembro #${member.id}`}</span>
                              </div>
                              <Badge variant="outline">{formatCurrency(total, 'CLP')}</Badge>
                            </div>
                            <ul className="space-y-2 ml-6">
                              {memberExpenses.map(expense => (
                                <li key={expense.id} className="group flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-muted-foreground/70" />
                                    <div>
                                      <p>{expense.description}</p>
                                      <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{formatCurrency(expense.amount, 'CLP')}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExpense(expense)}>
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar Gasto?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar el gasto "{expense.description}"?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteExpense(expense.id, expense.description)}>Eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
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
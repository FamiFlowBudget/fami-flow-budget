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

  // (El resto de las funciones no cambian)
  const handleDeleteExpense = async (expenseId: string, description: string) => { /* ... */ };
  const organizedExpenses = categories.map(category => { /* ... */ }).filter(ce => ce.hasData);
  const toggleCategory = (categoryId: string) => { /* ... */ };

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

      {/* <<<--- LÓGICA DE CARGA ACTUALIZADA ---<<< */}
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
            // ... (El resto del código de la lista es idéntico)
            const IconComponent = getCategoryIconById(categoryData.category.id, categories);
            return (
              <Collapsible key={categoryData.category.id} open={expandedCategories.has(categoryData.category.id)} onOpenChange={() => toggleCategory(categoryData.category.id)}>
                {/* ... Contenido del Collapsible ... */}
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
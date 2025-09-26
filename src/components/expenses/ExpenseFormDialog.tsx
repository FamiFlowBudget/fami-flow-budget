// src/components/expenses/ExpenseFormDialog.tsx (Versión Mejorada)

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { PaymentMethod } from '@/types/budget';
import { Calculator, Calendar, CreditCard, Tag, User, FolderOpen } from 'lucide-react';

// (Las interfaces no cambian)
interface ExpenseFormData {
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  date: string;
  memberId?: string;
}
interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: { id: string; amount: number; categoryId: string; description: string; merchant?: string; paymentMethod: PaymentMethod; date: string; memberId?: string; };
}

export const ExpenseFormDialog = ({ isOpen, onClose, expenseToEdit }: ExpenseFormDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>();
  const { addExpense, updateExpense, categories, currentMember, members, currency } = useBudgetSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);

  // Lógica para inicializar el formulario (no cambia)
  useEffect(() => {
    const defaultValues = {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'debit' as PaymentMethod,
      amount: 0,
      categoryId: '',
      subcategoryId: '',
      description: '',
      merchant: '',
      memberId: currentMember?.role !== 'admin' ? currentMember?.id : '' // MEJORA: Admin debe seleccionar explícitamente
    };

    if (expenseToEdit) {
      const expenseCategory = categories.find(cat => cat.id === expenseToEdit.categoryId);
      if (expenseCategory?.parentId) {
        defaultValues.categoryId = expenseCategory.parentId;
        defaultValues.subcategoryId = expenseCategory.id;
      } else {
        defaultValues.categoryId = expenseToEdit.categoryId;
      }
      defaultValues.amount = expenseToEdit.amount;
      defaultValues.description = expenseToEdit.description || '';
      defaultValues.merchant = expenseToEdit.merchant || '';
      defaultValues.paymentMethod = expenseToEdit.paymentMethod;
      defaultValues.date = expenseToEdit.date;
      defaultValues.memberId = expenseToEdit.memberId;
    }
    reset(defaultValues);
  }, [expenseToEdit, isOpen, reset, categories, currentMember]);

  // Lógica para actualizar subcategorías (no cambia)
  const watchedCategoryId = watch('categoryId');
  useEffect(() => {
    if (watchedCategoryId) {
      const subcategories = categories.filter(cat => cat.parentId === watchedCategoryId);
      setAvailableSubcategories(subcategories);
      // No reseteamos subcategoryId si ya hay una seleccionada para permitir la edición
    }
  }, [watchedCategoryId, categories]);


  const onSubmit = async (data: ExpenseFormData) => {
    if (!currentMember) {
      toast({ title: "Error", description: "No hay un miembro de familia actual.", variant: "destructive" });
      return;
    }

    const targetMemberId = (currentMember.role === 'admin' && data.memberId) ? data.memberId : currentMember.id;
    if (!targetMemberId) {
      toast({ title: "Campo requerido", description: "Por favor, selecciona un miembro.", variant: "destructive" });
      return;
    }
    
    const finalCategoryId = data.subcategoryId || data.categoryId;
    if (!finalCategoryId) {
      toast({ title: "Campo requerido", description: "Por favor, selecciona una categoría.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
          categoryId: finalCategoryId,
          memberId: targetMemberId,
          amount: data.amount,
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.paymentMethod,
          date: data.date,
        });
      } else {
        await addExpense({
          memberId: targetMemberId,
          categoryId: finalCategoryId,
          amount: data.amount,
          currency,
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.paymentMethod,
          tags: [],
          date: data.date,
        });
      }
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || (expenseToEdit ? "No se pudo actualizar el gasto" : "No se pudo agregar el gasto"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <span>{expenseToEdit ? 'Editar Gasto' : 'Nuevo Gasto'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ... (el resto de los campos como Monto, Descripción, etc. no cambian) ... */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            {expenseToEdit ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isSubmitting} className="bg-gradient-primary">
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Gasto'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar cambios?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres guardar los cambios en este gasto?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit(onSubmit)}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
                {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
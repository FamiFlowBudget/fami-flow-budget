// src/components/expenses/ExpenseFormDialog.tsx

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
import { supabase } from '@/integrations/supabase/client';

interface ExpenseFormData {
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  date: string;
  memberId?: string;
  receiptUrl?: string;
}

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: any;
}

export const ExpenseFormDialog = ({ isOpen, onClose, expenseToEdit }: ExpenseFormDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>();
  const { addExpense, updateExpense, categories, currentMember, members, currency } = useBudgetSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);
  const [publicReceiptUrl, setPublicReceiptUrl] = useState<string | null>(null);

  const watchedCategoryId = watch('categoryId');

  useEffect(() => {
    const defaultValues: Partial<ExpenseFormData> = {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'debit',
      memberId: currentMember?.role !== 'admin' ? currentMember?.id : '',
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
      defaultValues.description = expenseToEdit.description;
      defaultValues.merchant = expenseToEdit.merchant;
      defaultValues.paymentMethod = expenseToEdit.paymentMethod;
      defaultValues.date = expenseToEdit.date;
      defaultValues.memberId = expenseToEdit.memberId;
      defaultValues.receiptUrl = expenseToEdit.receiptUrl;

      if (expenseToEdit.receiptUrl) {
        const { data } = supabase.storage.from('receipts').getPublicUrl(expenseToEdit.receiptUrl);
        setPublicReceiptUrl(data.publicUrl);
      }
    }
    reset(defaultValues);
  }, [expenseToEdit, isOpen, reset, categories, currentMember]);

  useEffect(() => {
    if (watchedCategoryId) {
      const subcategories = categories.filter(cat => cat.parentId === watchedCategoryId);
      setAvailableSubcategories(subcategories);
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
    const expenseData = {
      memberId: targetMemberId,
      categoryId: finalCategoryId,
      amount: data.amount,
      currency,
      description: data.description,
      merchant: data.merchant,
      paymentMethod: data.paymentMethod,
      tags: [],
      date: data.date,
      receiptUrl: data.receiptUrl,
    };

    try {
      let success = false;
      if (expenseToEdit?.id) {
        const updatedExpense = await updateExpense(expenseToEdit.id, expenseData);
        if (updatedExpense) {
          success = true;
        }
      } else {
        const newExpense = await addExpense(expenseData);
        if (newExpense) {
          success = true;
        }
      }

      if (success) {
        handleClose();
      } else {
        toast({ title: "Error al guardar", description: "No se pudo guardar el gasto. Por favor, intente de nuevo.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message || "No se pudo guardar el gasto", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setPublicReceiptUrl(null);
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
            <span>{expenseToEdit?.id ? 'Editar Gasto' : 'Nuevo Gasto'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {publicReceiptUrl && (
            <div className="space-y-2">
              <Label>Imagen de la Boleta</Label>
              <img src={publicReceiptUrl} alt="Boleta" className="rounded-md max-h-40 w-auto mx-auto" />
            </div>
          )}

          {/* El resto del formulario */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center space-x-2"><Calculator className="h-4 w-4" /><span>Monto *</span></Label>
            <Input id="amount" type="number" step="100" min="0" placeholder="0" {...register('amount', { required: 'El monto es obligatorio', min: { value: 1, message: 'El monto debe ser mayor a 0' } })} />
            {errors.amount && <span className="text-sm text-destructive">{errors.amount.message}</span>}
          </div>

          {currentMember?.role === 'admin' && (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2"><User className="h-4 w-4" /><span>Miembro *</span></Label>
              <Select onValueChange={(value) => setValue('memberId', value)} value={watch('memberId')}>
                <SelectTrigger><SelectValue placeholder="Selecciona un miembro" /></SelectTrigger>
                <SelectContent>
                  {members.map((member) => (<SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center space-x-2"><Tag className="h-4 w-4" /><span>Categoría Principal *</span></Label>
            <Select onValueChange={(value) => setValue('categoryId', value)} value={watch('categoryId')}>
              <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
              <SelectContent>
                {categories.filter(cat => !cat.parentId).map((category) => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center space-x-2"><FolderOpen className="h-4 w-4" /><span>Subcategoría</span></Label>
            <Select onValueChange={(value) => setValue('subcategoryId', value)} value={watch('subcategoryId')} disabled={availableSubcategories.length === 0}>
              <SelectTrigger><SelectValue placeholder="Selecciona una subcategoría (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {availableSubcategories.map((subcategory) => (<SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input id="description" placeholder="¿En qué gastaste?" {...register('description', { required: 'La descripción es obligatoria' })} />
            {errors.description && <span className="text-sm text-destructive">{errors.description.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Comercio</Label>
            <Input id="merchant" placeholder="¿Dónde compraste?" {...register('merchant')} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2"><CreditCard className="h-4 w-4" /><span>Método de pago</span></Label>
            <Select defaultValue="debit" onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-2"><Calendar className="h-4 w-4" /><span>Fecha</span></Label>
            <Input id="date" type="date" {...register('date', { required: 'La fecha es obligatoria' })} />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting ? 'Guardando...' : (expenseToEdit?.id ? 'Actualizar Gasto' : 'Guardar Gasto')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

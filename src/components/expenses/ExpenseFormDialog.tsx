import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { PaymentMethod } from '@/types/budget';
import { Calculator, Calendar, CreditCard, Tag, User, FolderOpen } from 'lucide-react';

interface ExpenseFormData {
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  date: string;
  memberId?: string; // For admin to select member
}

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: {
    id: string;
    amount: number;
    categoryId: string;
    description: string;
    merchant?: string;
    paymentMethod: PaymentMethod;
    date: string;
    memberId?: string;
  };
}

export const ExpenseFormDialog = ({ isOpen, onClose, expenseToEdit }: ExpenseFormDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: expenseToEdit?.date || new Date().toISOString().split('T')[0],
      paymentMethod: expenseToEdit?.paymentMethod || 'debit',
      amount: expenseToEdit?.amount || 0,
      categoryId: expenseToEdit?.categoryId || '',
      subcategoryId: '',
      description: expenseToEdit?.description || '',
      merchant: expenseToEdit?.merchant || '',
      memberId: expenseToEdit?.memberId || '',
    }
  });
  
  const { addExpense, updateExpense, categories, currentMember, members, currency } = useBudgetSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);

  const watchedCategoryId = watch('categoryId');

  // Update subcategories when main category changes
  useEffect(() => {
    if (watchedCategoryId) {
      const mainCategory = categories.find(cat => cat.id === watchedCategoryId && !cat.parentId);
      if (mainCategory) {
        setSelectedMainCategory(mainCategory.id);
        const subcategories = categories.filter(cat => cat.parentId === mainCategory.id);
        setAvailableSubcategories(subcategories);
        setValue('subcategoryId', '');
      } else {
        // If selected category is a subcategory, find its parent
        const subcategory = categories.find(cat => cat.id === watchedCategoryId && cat.parentId);
        if (subcategory) {
          setSelectedMainCategory(subcategory.parentId);
          setValue('categoryId', subcategory.parentId);
          setValue('subcategoryId', subcategory.id);
          const subcategories = categories.filter(cat => cat.parentId === subcategory.parentId);
          setAvailableSubcategories(subcategories);
        }
      }
    }
  }, [watchedCategoryId, categories, setValue]);

  // Initialize form with existing expense data
  useEffect(() => {
    if (expenseToEdit) {
      const expense = expenseToEdit;
      const expenseCategory = categories.find(cat => cat.id === expense.categoryId);
      
      if (expenseCategory?.parentId) {
        // It's a subcategory
        setSelectedMainCategory(expenseCategory.parentId);
        setValue('categoryId', expenseCategory.parentId);
        setValue('subcategoryId', expenseCategory.id);
        const subcategories = categories.filter(cat => cat.parentId === expenseCategory.parentId);
        setAvailableSubcategories(subcategories);
      } else {
        // It's a main category
        setSelectedMainCategory(expense.categoryId);
        setValue('categoryId', expense.categoryId);
        setValue('subcategoryId', '');
        const subcategories = categories.filter(cat => cat.parentId === expense.categoryId);
        setAvailableSubcategories(subcategories);
      }
    }
  }, [expenseToEdit, categories, setValue]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!currentMember) {
      toast({
        title: "Error",
        description: "No hay un usuario seleccionado",
        variant: "destructive",
      });
      return;
    }

    // Determinar el miembro: si es admin y seleccionó uno, usar ese; sino, usar el currentMember
    const targetMemberId = (currentMember.role === 'admin' && data.memberId) ? data.memberId : currentMember.id;
    
    // Determinar la categoría final: subcategoría si está seleccionada, sino categoría principal
    const finalCategoryId = data.subcategoryId || data.categoryId;

    setIsSubmitting(true);
    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
          categoryId: finalCategoryId,
          amount: data.amount,
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.paymentMethod,
          date: data.date,
        });

        toast({
          title: "¡Gasto actualizado!",
          description: `Se actualizó el gasto de $${data.amount.toLocaleString('es-CL')}`,
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

        toast({
          title: "¡Gasto agregado!",
          description: `Se registró un gasto de $${data.amount.toLocaleString('es-CL')}`,
        });
      }

      reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: expenseToEdit ? "No se pudo actualizar el gasto" : "No se pudo agregar el gasto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedMainCategory('');
    setAvailableSubcategories([]);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Monto *</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="100"
              min="0"
              placeholder="0"
              className="text-lg font-medium"
              {...register('amount', { 
                required: 'El monto es obligatorio',
                min: { value: 1, message: 'El monto debe ser mayor a 0' }
              })}
            />
            {errors.amount && (
              <span className="text-sm text-destructive">{errors.amount.message}</span>
            )}
          </div>

          {/* Miembro (solo para admin) */}
          {currentMember?.role === 'admin' && (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Miembro *</span>
              </Label>
              <Select onValueChange={(value) => setValue('memberId', value)} defaultValue={expenseToEdit?.memberId || currentMember.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un miembro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Categoría Principal */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Categoría Principal *</span>
            </Label>
            <Select onValueChange={(value) => setValue('categoryId', value)} value={watchedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => !cat.parentId).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📁</span>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>Subcategoría</span>
            </Label>
            <Select 
              onValueChange={(value) => setValue('subcategoryId', value)} 
              value={watch('subcategoryId')}
              disabled={!selectedMainCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedMainCategory ? "Selecciona una subcategoría" : "Primero selecciona una categoría"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">∅</span>
                    Ninguna
                  </div>
                </SelectItem>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">└</span>
                      {subcategory.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="¿En qué gastaste?"
              {...register('description', { required: 'La descripción es obligatoria' })}
            />
            {errors.description && (
              <span className="text-sm text-destructive">{errors.description.message}</span>
            )}
          </div>

          {/* Comercio */}
          <div className="space-y-2">
            <Label htmlFor="merchant">Comercio</Label>
            <Input
              id="merchant"
              placeholder="¿Dónde compraste?"
              {...register('merchant')}
            />
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Método de pago</span>
            </Label>
            <Select 
              defaultValue={expenseToEdit?.paymentMethod || "debit"}
              onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Fecha</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: 'La fecha es obligatoria' })}
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? 'Guardando...' : (expenseToEdit ? 'Actualizar Gasto' : 'Guardar Gasto')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
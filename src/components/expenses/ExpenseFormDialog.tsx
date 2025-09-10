import { useState } from 'react';
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
import { Calculator, Calendar, CreditCard, Tag } from 'lucide-react';

interface ExpenseFormData {
  amount: number;
  categoryId: string;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  date: string;
}

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseFormDialog = ({ isOpen, onClose }: ExpenseFormDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'debit',
    }
  });
  
  const { addExpense, categories, currentMember, currency } = useBudgetSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!currentMember) {
      toast({
        title: "Error",
        description: "No hay un usuario seleccionado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        memberId: currentMember.id,
        categoryId: data.categoryId,
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

      reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto",
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
            <span>Nuevo Gasto</span>
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

          {/* Categoría */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Categoría *</span>
            </Label>
            <Select onValueChange={(value) => setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
              defaultValue="debit"
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
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
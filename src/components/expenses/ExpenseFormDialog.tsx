// src/components/expenses/ExpenseFormDialog.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
// ... (otros imports no cambian)
import { supabase } from '@/integrations/supabase/client'; // Necesitamos esto para la URL pública

// ... (Las interfaces se actualizan para incluir receiptUrl)
interface ExpenseFormData {
  // ...
  receiptUrl?: string;
}
interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: { /* ... */ receiptUrl?: string; };
}

export const ExpenseFormDialog = ({ isOpen, onClose, expenseToEdit }: ExpenseFormDialogProps) => {
  // ... (toda la lógica inicial del formulario no cambia)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>();
  const { addExpense, updateExpense, ... } = useBudgetSupabase();
  const [publicReceiptUrl, setPublicReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    // ... (la lógica de inicialización es similar, solo se añade receiptUrl)
    if (expenseToEdit?.receiptUrl) {
      // Obtenemos la URL pública para mostrar la imagen
      const { data } = supabase.storage.from('receipts').getPublicUrl(expenseToEdit.receiptUrl);
      setPublicReceiptUrl(data.publicUrl);
    }
  }, [expenseToEdit, isOpen]);

  const onSubmit = async (data: ExpenseFormData) => {
    // ... (la lógica de onSubmit se actualiza para enviar receiptUrl)
    const expenseData = {
      // ... otros campos
      receiptUrl: expenseToEdit?.receiptUrl, // Pasamos la URL al guardar
    };
    if (expenseToEdit) {
      await updateExpense(expenseToEdit.id, expenseData);
    } else {
      await addExpense(expenseData);
    }
    // ...
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>{/* ... */}</DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <<<--- NUEVA SECCIÓN PARA MOSTRAR LA IMAGEN ---<<< */}
          {publicReceiptUrl && (
            <div className="space-y-2">
              <Label>Imagen de la Boleta</Label>
              <img src={publicReceiptUrl} alt="Boleta" className="rounded-md max-h-40 w-auto mx-auto" />
            </div>
          )}

          {/* ... (El resto del formulario es idéntico) ... */}
        </form>
      </DialogContent>
    </Dialog>
  );
};
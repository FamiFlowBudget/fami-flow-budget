// src/components/import/ImportManagement.tsx

import { useState, useRef } from 'react';
// ... (otros imports)
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog'; // Importamos el formulario

export const ImportManagement = () => {
  // ... (otros useState)
  const [expenseDataForForm, setExpenseDataForForm] = useState<any>(null); // <<<--- Nuevo estado para controlar el formulario

  // ... (la lógica de la cámara no cambia)
  const startCamera = async () => { /* ... */ };
  const stopCamera = () => { /* ... */ };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !currentFamily) return;
    setProcessingImage(true);
    // ... (lógica para capturar la imagen en un 'blob')

    canvas.toBlob(async (blob) => {
      if (!blob) { /* ... */ return; }
      
      try {
        // Subimos la imagen a Supabase Storage (esto no cambia)
        const filePath = `${currentFamily.id}/${user.id}/${new Date().toISOString()}.jpeg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, blob);
        if (uploadError) throw uploadError;

        // <<<--- CAMBIO CLAVE: ABRIMOS EL FORMULARIO ---<<<
        // En lugar de llamar a la Edge Function, abrimos el diálogo de nuevo gasto
        // pasándole la ruta de la imagen que acabamos de subir.
        setExpenseDataForForm({
          receiptUrl: uploadData.path, // Pasamos la RUTA, no la URL pública
          date: new Date().toISOString().split('T')[0], // Pre-llenamos la fecha
        });
        
        stopCamera();
      } catch (error: any) {
        toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
      } finally {
        setProcessingImage(false);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="space-y-6">
      {/* ... (toda la parte visual de la página de importación no cambia) ... */}

      {/* <<<--- AÑADIMOS EL DIÁLOGO DEL FORMULARIO AQUÍ ---<<< */}
      {expenseDataForForm && (
        <ExpenseFormDialog
          isOpen={!!expenseDataForForm}
          onClose={() => setExpenseDataForForm(null)}
          expenseToEdit={expenseDataForForm}
        />
      )}
    </div>
  );
};
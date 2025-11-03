// src/components/import/ImportManagement.tsx

import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Zap, X, Image as ImageIcon } from 'lucide-react';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog'; // Importamos el formulario

export const ImportManagement = () => {
  const { user, currentFamily } = useBudgetSupabase();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [expenseDataForForm, setExpenseDataForForm] = useState<any>(null); // <<<--- Nuevo estado para controlar el formulario

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      toast({ title: "Error de Cámara", description: "No se pudo acceder a la cámara. Revisa los permisos.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !currentFamily) return;
    setProcessingImage(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload />
            Importar Gasto
          </CardTitle>
          <CardDescription>
            Captura una foto de tu boleta o recibo para crear un gasto rápidamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            {!isCameraOn && (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                <p>La cámara está apagada</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {!isCameraOn ? (
              <Button onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Activar Cámara
              </Button>
            ) : (
              <>
                <Button onClick={captureImage} disabled={processingImage}>
                  <Zap className="w-4 h-4 mr-2" />
                  {processingImage ? 'Procesando...' : 'Capturar y Continuar'}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" />
                  Apagar Cámara
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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
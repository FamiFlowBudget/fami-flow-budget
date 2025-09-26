// src/components/import/ImportManagement.tsx (Versión Final con Backend OCR)

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useFamilies } from '@/hooks/useFamilies'; // Importamos para obtener la familia actual
import { useAuth } from '@/hooks/useAuth'; // Importamos para obtener el usuario actual
import { supabase } from '@/integrations/supabase/client'; // Importamos el cliente de Supabase

interface ImportedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  status: 'pending' | 'imported' | 'duplicate' | 'error';
  error?: string;
}

export const ImportManagement = () => {
  const { toast } = useToast();
  const { addExpense, categories, currentMember } = useBudgetSupabase();
  const { currentFamily } = useFamilies();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedData, setImportedData] = useState<ImportedTransaction[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  // --- LÓGICA DE CÁMARA ACTUALIZADA ---
  const startCamera = async () => { /* ... (Esta función no cambia) ... */ };
  const stopCamera = () => { /* ... (Esta función no cambia) ... */ };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !currentFamily) return;
    
    setProcessingImage(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setProcessingImage(false);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setProcessingImage(false);
        return;
      }
      
      try {
        // Paso 1: Subir la imagen a Supabase Storage
        toast({ title: "Paso 1/2: Subiendo imagen..." });
        const filePath = `${currentFamily.id}/${user.id}/${new Date().toISOString()}.jpeg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Paso 2: Llamar a nuestra Edge Function
        toast({ title: "Paso 2/2: Leyendo la factura..." });
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'ocr-process-receipt',
          { body: { imagePath: uploadData.path } }
        );

        if (functionError) throw functionError;
        
        const extracted = functionData.data;

        const newTransaction: ImportedTransaction = {
          id: `receipt-${Date.now()}`,
          date: extracted.date,
          description: extracted.merchant,
          amount: extracted.total,
          status: 'pending'
        };

        setImportedData(prev => [...prev, newTransaction]);
        toast({
          title: "¡Información Extraída!",
          description: `Se encontró un gasto de $${extracted.total.toLocaleString('es-CL')}`,
        });
        stopCamera();

      } catch (error: any) {
        toast({
          title: "Error al procesar imagen",
          description: error.message || "No se pudo procesar la imagen capturada",
          variant: "destructive"
        });
      } finally {
        setProcessingImage(false);
      }
    }, 'image/jpeg', 0.8);
  };

  // --- ELIMINAMOS LAS FUNCIONES ANTIGUAS DE OCR Y PARSEO ---
  // `extractDataFromImage` y `parseReceiptText` ya no son necesarias.

  const importTransaction = async (transaction: ImportedTransaction) => { /* ... (Esta función no cambia) ... */ };
  const importAllTransactions = async () => { /* ... (Esta función no cambia) ... */ };
  const removeTransaction = (id: string) => { /* ... (Esta función no cambia) ... */ };
  const getStatusBadge = (status: ImportedTransaction['status']) => { /* ... (Esta función no cambia) ... */ };

  return (
    <div className="space-y-6">
      {/* ... (El resto de la parte visual del componente no cambia) ... */}
    </div>
  );
};
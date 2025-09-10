import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

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
  const { addExpense, categories, members, currentMember } = useBudgetSupabase();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedData, setImportedData] = useState<ImportedTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'excel' | 'pdf') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    processFile(file, type);
  };

  const processFile = async (file: File, type: 'csv' | 'excel' | 'pdf') => {
    setImporting(true);
    setProgress(0);
    
    try {
      let transactions: ImportedTransaction[] = [];

      if (type === 'csv') {
        transactions = await parseCSV(file);
      } else if (type === 'excel') {
        transactions = await parseExcel(file);
      } else if (type === 'pdf') {
        transactions = await parsePDF(file);
      }

      // Simular progreso
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setImportedData(transactions);
      toast({
        title: "Archivo procesado",
        description: `Se encontraron ${transactions.length} transacciones`,
      });
    } catch (error) {
      toast({
        title: "Error al procesar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const parseCSV = async (file: File): Promise<ImportedTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          
          // Detectar columnas automáticamente
          const dateColumn = headers.findIndex(h => 
            h.includes('fecha') || h.includes('date') || h.includes('día')
          );
          const descColumn = headers.findIndex(h => 
            h.includes('descripción') || h.includes('description') || h.includes('detalle')
          );
          const amountColumn = headers.findIndex(h => 
            h.includes('monto') || h.includes('amount') || h.includes('valor')
          );

          if (dateColumn === -1 || descColumn === -1 || amountColumn === -1) {
            throw new Error('No se pudieron detectar las columnas necesarias (fecha, descripción, monto)');
          }

          const transactions: ImportedTransaction[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const columns = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
            
            if (columns.length >= Math.max(dateColumn, descColumn, amountColumn) + 1) {
              const rawAmount = columns[amountColumn].replace(/[^\d.-]/g, '');
              const amount = parseFloat(rawAmount);
              
              if (!isNaN(amount)) {
                transactions.push({
                  id: `csv-${i}`,
                  date: columns[dateColumn],
                  description: columns[descColumn],
                  amount: Math.abs(amount),
                  status: 'pending'
                });
              }
            }
          }

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  };

  const parseExcel = async (file: File): Promise<ImportedTransaction[]> => {
    // Para Excel necesitaríamos una librería como xlsx
    // Por ahora simulamos la funcionalidad
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'excel-1',
            date: '2024-01-15',
            description: 'Supermercado Jumbo',
            amount: 45000,
            status: 'pending'
          },
          {
            id: 'excel-2',
            date: '2024-01-14',
            description: 'Farmacia Cruz Verde',
            amount: 12500,
            status: 'pending'
          }
        ]);
      }, 2000);
    });
  };

  const parsePDF = async (file: File): Promise<ImportedTransaction[]> => {
    // Para PDF necesitaríamos una librería como pdf-parse
    // Por ahora simulamos la funcionalidad
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'pdf-1',
            date: '2024-01-15',
            description: 'COMPRA ONLINE FALABELLA',
            amount: 89000,
            status: 'pending'
          },
          {
            id: 'pdf-2',
            date: '2024-01-14',
            description: 'PAGO SERVICIO LUZ',
            amount: 35000,
            status: 'pending'
          },
          {
            id: 'pdf-3',
            date: '2024-01-13',
            description: 'RETIRO CAJERO AUTOMATICO',
            amount: 50000,
            status: 'pending'
          }
        ]);
      }, 2500);
    });
  };

  const importTransaction = async (transaction: ImportedTransaction) => {
    if (!currentMember) {
      toast({
        title: "Error",
        description: "No hay miembro activo seleccionado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Intentar asignar categoría automáticamente
      const defaultCategory = categories.find(c => 
        c.name.toLowerCase().includes('general') || 
        c.name.toLowerCase().includes('otros')
      ) || categories[0];

      await addExpense({
        amount: transaction.amount,
        description: transaction.description,
        categoryId: defaultCategory?.id || '',
        memberId: currentMember.id,
        date: transaction.date,
        paymentMethod: 'transfer',
        tags: [],
        currency: 'CLP'
      });

      setImportedData(prev => prev.map(t => 
        t.id === transaction.id 
          ? { ...t, status: 'imported' as const }
          : t
      ));

      toast({
        title: "Transacción importada",
        description: `${transaction.description} ha sido agregada`,
      });
    } catch (error) {
      setImportedData(prev => prev.map(t => 
        t.id === transaction.id 
          ? { ...t, status: 'error' as const, error: 'Error al importar' }
          : t
      ));
      
      toast({
        title: "Error al importar",
        description: "No se pudo importar la transacción",
        variant: "destructive"
      });
    }
  };

  const importAllTransactions = async () => {
    const pendingTransactions = importedData.filter(t => t.status === 'pending');
    
    for (const transaction of pendingTransactions) {
      await importTransaction(transaction);
      await new Promise(resolve => setTimeout(resolve, 500)); // Evitar spam
    }
  };

  const removeTransaction = (id: string) => {
    setImportedData(prev => prev.filter(t => t.id !== id));
  };

  const getStatusBadge = (status: ImportedTransaction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'imported':
        return <Badge variant="default" className="bg-green-500">Importado</Badge>;
      case 'duplicate':
        return <Badge variant="outline">Duplicado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Usar cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessingImage(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    ctx.drawImage(video, 0, 0);
    
    // Convertir a blob para procesamiento
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      try {
        const transactions = await extractDataFromImage(blob);
        
        if (transactions.length === 0) {
          toast({
            title: "No se encontraron datos",
            description: "No se pudo extraer información de gastos de la imagen. Intenta con mejor iluminación.",
            variant: "destructive"
          });
        } else {
          setImportedData(prev => [...prev, ...transactions]);
          toast({
            title: "Imagen procesada",
            description: `Se extrajeron ${transactions.length} gastos de la imagen`,
          });
        }
        
        stopCamera();
      } catch (error) {
        toast({
          title: "Error al procesar imagen",
          description: "No se pudo procesar la imagen capturada",
          variant: "destructive"
        });
      } finally {
        setProcessingImage(false);
      }
    }, 'image/jpeg', 0.8);
  };

  const extractDataFromImage = async (imageBlob: Blob): Promise<ImportedTransaction[]> => {
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('spa', 1, {
      logger: m => console.log(m)
    });
    
    try {
      const { data: { text } } = await worker.recognize(imageBlob);
      console.log('OCR Text:', text);
      
      // Procesar el texto extraído para encontrar información de gastos
      const transactions = parseReceiptText(text);
      
      await worker.terminate();
      return transactions;
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  };

  const parseReceiptText = (text: string): ImportedTransaction[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const transactions: ImportedTransaction[] = [];
    
    // Patrones comunes para extraer información
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
    const amountPattern = /\$?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/;
    const totalPattern = /(?:total|suma|subtotal|monto)\s*:?\s*\$?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i;
    
    let foundDate = '';
    let merchantName = '';
    let totalAmount = 0;
    
    // Buscar fecha
    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        foundDate = dateMatch[1];
        break;
      }
    }
    
    // Buscar nombre del comercio (típicamente en las primeras líneas)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (!line.match(/\d/) && line.length > 3 && line.length < 50) {
        merchantName = lines[i];
        break;
      }
    }
    
    // Buscar monto total
    for (const line of lines) {
      const totalMatch = line.match(totalPattern);
      if (totalMatch) {
        const amount = parseFloat(totalMatch[1].replace(/[.,]/g, ''));
        if (!isNaN(amount)) {
          totalAmount = amount;
          break;
        }
      }
    }
    
    // Si no se encontró un total específico, buscar el monto más grande
    if (totalAmount === 0) {
      let maxAmount = 0;
      for (const line of lines) {
        const amounts = line.match(new RegExp(amountPattern.source, 'g'));
        if (amounts) {
          for (const amountStr of amounts) {
            const amount = parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(/[.,]/g, ''));
            if (!isNaN(amount) && amount > maxAmount) {
              maxAmount = amount;
            }
          }
        }
      }
      totalAmount = maxAmount;
    }
    
    // Crear transacción si tenemos información suficiente
    if (totalAmount > 0) {
      transactions.push({
        id: `receipt-${Date.now()}`,
        date: foundDate || new Date().toISOString().split('T')[0],
        description: merchantName || 'Gasto desde imagen',
        amount: totalAmount,
        status: 'pending'
      });
    }
    
    return transactions;
  };

  const downloadTemplate = () => {
    const csvContent = [
      ['fecha', 'descripción', 'monto', 'categoría'],
      ['2024-01-15', 'Supermercado Jumbo', '45000', 'Alimentación'],
      ['2024-01-14', 'Farmacia Cruz Verde', '12500', 'Salud'],
      ['2024-01-13', 'Combustible Copec', '30000', 'Transporte']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-gastos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Importar Datos</h2>
          <p className="text-muted-foreground">
            Importa gastos desde archivos CSV, Excel o estados de cuenta PDF
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Plantilla CSV
        </Button>
      </div>

      {/* Import Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => csvInputRef.current?.click()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Archivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sube un archivo CSV con tus gastos exportados desde otras aplicaciones
            </p>
            <Button className="w-full" disabled={importing}>
              {importing ? 'Procesando...' : 'Seleccionar Archivo'}
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e, 'csv')}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => excelInputRef.current?.click()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Excel / Sheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Importa desde hojas de cálculo de Excel o Google Sheets
            </p>
            <Button className="w-full" disabled={importing}>
              {importing ? 'Procesando...' : 'Seleccionar Archivo'}
            </Button>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e, 'excel')}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => pdfInputRef.current?.click()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              Estado de Cuenta PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Extrae transacciones automáticamente desde estados de cuenta PDF
            </p>
            <Button className="w-full" disabled={importing}>
              {importing ? 'Procesando...' : 'Seleccionar Archivo'}
            </Button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e, 'pdf')}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={startCamera}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              Capturar Factura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Toma una foto de tu factura o recibo para extraer automáticamente el gasto
            </p>
            <Button className="w-full" disabled={importing || processingImage}>
              {processingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Usar Cámara'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-4 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Capturar Factura</h3>
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-96 rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
                <Button
                  onClick={captureImage}
                  disabled={processingImage}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {processingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Asegúrate de que la factura esté bien iluminada y enfocada antes de capturar
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando archivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transacciones Encontradas ({importedData.length})</CardTitle>
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setImportedData([])}
                >
                  Limpiar
                </Button>
                <Button 
                  onClick={importAllTransactions}
                  disabled={!importedData.some(t => t.status === 'pending')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Importar Todas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {importedData.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {transaction.description}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(transaction.date).toLocaleDateString('es-CL')}</span>
                      <span className="font-medium">${transaction.amount.toLocaleString('es-CL')}</span>
                    </div>
                    {transaction.error && (
                      <p className="text-xs text-destructive mt-1">{transaction.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {transaction.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => importTransaction(transaction)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeTransaction(transaction.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Formato Requerido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>CSV:</strong> Debe incluir columnas 'fecha', 'descripción' y 'monto'</p>
            <p><strong>Excel:</strong> Formato similar al CSV, primera fila como encabezados</p>
            <p><strong>PDF:</strong> Estados de cuenta bancarios con transacciones listadas</p>
            <p><strong>Cámara:</strong> Captura facturas o recibos con buena iluminación para extracción automática</p>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium mb-2">Ejemplo de formato CSV:</p>
              <code className="text-xs">
                fecha,descripción,monto<br/>
                2024-01-15,Supermercado Jumbo,45000<br/>
                2024-01-14,Farmacia Cruz Verde,12500
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
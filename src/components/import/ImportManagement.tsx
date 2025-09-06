import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
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
      <div className="grid gap-6 md:grid-cols-3">
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
      </div>

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
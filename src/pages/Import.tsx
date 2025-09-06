import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";

export default function Import() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Datos</h1>
        <p className="text-muted-foreground mt-2">
          Importa gastos desde archivos CSV, Excel o conecta con tu banco
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Archivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sube un archivo CSV con tus gastos exportados desde otras aplicaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Excel / Sheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Importa desde hojas de cálculo de Excel o Google Sheets
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conexión directa con bancos y tarjetas de crédito
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
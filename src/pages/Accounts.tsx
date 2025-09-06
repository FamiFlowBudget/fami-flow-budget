import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Landmark, Wallet, Plus } from "lucide-react";

export default function Accounts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cuentas y Tarjetas</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus cuentas bancarias y métodos de pago
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Cuenta Corriente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Banco de Chile - ****1234
            </p>
            <p className="text-lg font-bold mt-2">$2.450.000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tarjeta de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visa ****5678
            </p>
            <p className="text-lg font-bold mt-2 text-red-600">-$345.000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dinero en efectivo
            </p>
            <p className="text-lg font-bold mt-2">$125.000</p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Plus className="w-5 h-5" />
              Agregar Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conecta una nueva cuenta o método de pago
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
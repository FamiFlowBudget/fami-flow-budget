import { Dashboard } from "@/components/dashboard/Dashboard";
import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { DemoDataGenerator } from "@/components/demo/DemoDataGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Tag, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="space-y-6">
      {/* Accesos rápidos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Accesos Rápidos</h2>
          <DemoDataGenerator />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/budget">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PieChart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Presupuestos</CardTitle>
                    <CardDescription>Gestiona tus presupuestos mensuales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configura presupuestos por categoría y miembro familiar
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/categories">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/80 rounded-lg">
                    <Tag className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Categorías</CardTitle>
                    <CardDescription>Organiza tus tipos de gastos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crea y personaliza categorías de gastos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <Settings className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg text-muted-foreground">Próximamente</CardTitle>
                  <CardDescription>Más funciones en desarrollo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reportes, análisis y más herramientas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dashboard principal */}
      <Dashboard />
      
      {/* FAB para agregar gastos */}
      <AddExpenseFAB />
    </div>
  );
};

export default Index;

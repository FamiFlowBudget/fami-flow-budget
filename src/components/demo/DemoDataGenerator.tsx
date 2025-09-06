import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBudgetData } from '@/hooks/useBudgetData';
import { Database, Trash2, Plus } from 'lucide-react';
import { STORAGE_KEYS, Budget } from '@/types/budget';

export const DemoDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { categories, currency } = useBudgetData();
  const { toast } = useToast();

  const generateDemoData = async () => {
    setIsGenerating(true);
    
    try {
      // Generar presupuestos de ejemplo
      const currentYear = new Date().getFullYear();
      const demobudgets: Budget[] = categories.map((category, index) => ({
        id: `budget_${category.id}`,
        categoryId: category.id,
        year: currentYear,
        month: new Date().getMonth() + 1, // Mes actual
        amount: (index + 1) * 100000, // Montos variados
        currency,
      }));

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(demobudgets));

      // Generar algunos gastos de ejemplo
      const demoExpenses = [
        {
          id: 'exp_demo_1',
          memberId: 'member_1',
          categoryId: categories[1]?.id || 'cat_1', // Alimentación
          amount: 45000,
          currency,
          description: 'Supermercado semanal',
          merchant: 'Lider Express',
          paymentMethod: 'debit' as const,
          tags: [],
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_demo_2',
          memberId: 'member_1', 
          categoryId: categories[2]?.id || 'cat_2', // Transporte
          amount: 15000,
          currency,
          description: 'Combustible',
          merchant: 'Copec',
          paymentMethod: 'credit' as const,
          tags: [],
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'exp_demo_3',
          memberId: 'member_1',
          categoryId: categories[6]?.id || 'cat_6', // Entretenimiento
          amount: 25000,
          currency,
          description: 'Cine familiar',
          merchant: 'Cinemark',
          paymentMethod: 'cash' as const,
          tags: [],
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // Hace 2 días
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(demoExpenses));

      toast({
        title: "¡Datos demo generados!",
        description: "Se crearon presupuestos y gastos de ejemplo",
      });

      // Recargar la página para mostrar los nuevos datos
      window.location.reload();

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar los datos demo",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAllData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    toast({
      title: "Datos eliminados",
      description: "Se limpiaron todos los datos locales",
    });
    
    window.location.reload();
  };

  return (
    <Card className="p-4 mb-6 bg-muted/50 border-dashed">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium text-sm">Datos Demo</h3>
            <p className="text-xs text-muted-foreground">
              Genera datos de ejemplo para probar la app
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={generateDemoData}
            disabled={isGenerating}
            size="sm"
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            {isGenerating ? 'Generando...' : 'Demo'}
          </Button>
          
          <Button
            onClick={clearAllData}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>
    </Card>
  );
};
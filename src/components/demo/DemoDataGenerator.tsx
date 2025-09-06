import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { Database, Trash2, Plus } from 'lucide-react';

export const DemoDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { categories, currency, upsertBudget, addExpense, members } = useBudgetSupabase();
  const { toast } = useToast();

  const generateDemoData = async () => {
    if (categories.length === 0 || members.length === 0) {
      toast({
        title: "Error",
        description: "Necesitas tener categorías y miembros configurados primero",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generar presupuestos de ejemplo
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        await upsertBudget({
          categoryId: category.id,
          year: currentYear,
          month: currentMonth,
          amount: (i + 1) * 100000, // Montos variados
          currency,
        });
      }

      // Generar algunos gastos de ejemplo
      const demoExpenses = [
        {
          memberId: members[0].id,
          categoryId: categories[1]?.id || categories[0].id, // Alimentación o primera categoría
          amount: 45000,
          currency,
          description: 'Supermercado semanal',
          merchant: 'Lider Express',
          paymentMethod: 'debit' as const,
          tags: [],
          date: new Date().toISOString().split('T')[0],
        },
        {
          memberId: members[0].id,
          categoryId: categories[2]?.id || categories[0].id, // Transporte o primera categoría
          amount: 15000,
          currency,
          description: 'Combustible',
          merchant: 'Copec',
          paymentMethod: 'credit' as const,
          tags: [],
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ayer
        },
        {
          memberId: members[0].id,
          categoryId: categories[6]?.id || categories[0].id, // Entretenimiento o primera categoría
          amount: 25000,
          currency,
          description: 'Cine familiar',
          merchant: 'Cinemark',
          paymentMethod: 'cash' as const,
          tags: [],
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // Hace 2 días
        }
      ];

      for (const expense of demoExpenses) {
        await addExpense(expense);
      }

      toast({
        title: "¡Datos demo generados!",
        description: "Se crearon presupuestos y gastos de ejemplo",
      });

    } catch (error) {
      console.error('Error generando datos demo:', error);
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
    toast({
      title: "Función no disponible",
      description: "Esta función no está disponible con datos en Supabase. Los datos persisten en la base de datos.",
      variant: "destructive",
    });
  };

  return (
    <Card className="p-4 mb-6 bg-muted/50 border-dashed">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium text-sm">Datos Demo</h3>
            <p className="text-xs text-muted-foreground">
              Genera presupuestos y gastos de ejemplo
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
            disabled
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>
    </Card>
  );
};
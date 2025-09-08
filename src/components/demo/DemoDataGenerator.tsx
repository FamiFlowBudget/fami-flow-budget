import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { supabase } from '@/integrations/supabase/client';
import { Database, Trash2, Plus } from 'lucide-react';

export const DemoDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { categories, currency, upsertBudget, addExpense, members } = useBudgetSupabase();
  const { toast } = useToast();

  const _clearDataSilently = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Eliminar gastos
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', user.id);

    if (expensesError) throw expensesError;

    // Eliminar presupuestos  
    const { error: budgetsError } = await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id);

    if (budgetsError) throw budgetsError;
  };

  const clearAllData = async () => {
    setIsClearing(true);
    
    try {
      await _clearDataSilently();
      toast({
        title: "¡Datos limpiados!",
        description: "Se eliminaron todos los presupuestos y gastos",
      });
    } catch (error) {
      console.error('Error limpiando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron limpiar los datos",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

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
      // Primero limpiar datos existentes silenciosamente
      await _clearDataSilently();
      
      // Generar presupuestos de ejemplo más realistas
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Presupuestos realistas por categoría (en CLP)
      const budgetAmounts = {
        'Alimentación': 150000,
        'Transporte': 80000,
        'Entretenimiento': 50000,
        'Salud': 40000,
        'Educación': 60000,
        'Hogar': 100000,
        'Ropa': 30000,
        'Otros': 20000
      };

      // Crear presupuestos para el miembro principal
      const mainMember = members[0];
      
      for (const category of categories) {
        const amount = budgetAmounts[category.name] || 50000;
        await upsertBudget({
          categoryId: category.id,
          memberId: mainMember.id,
          year: currentYear,
          month: currentMonth,
          amount,
          currency,
        });
      }

      // Generar gastos de ejemplo
      const demoExpenses = [
        {
          memberId: mainMember.id,
          categoryId: categories.find(c => c.name === 'Alimentación')?.id || categories[0].id,
          amount: 45000,
          currency,
          description: 'Supermercado semanal',
          merchant: 'Lider Express',
          paymentMethod: 'debit' as const,
          tags: [],
          date: new Date().toISOString().split('T')[0],
        },
        {
          memberId: mainMember.id,
          categoryId: categories.find(c => c.name === 'Transporte')?.id || categories[0].id,
          amount: 15000,
          currency,
          description: 'Combustible',
          merchant: 'Copec',
          paymentMethod: 'credit' as const,
          tags: [],
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        },
        {
          memberId: mainMember.id,
          categoryId: categories.find(c => c.name === 'Entretenimiento')?.id || categories[0].id,
          amount: 25000,
          currency,
          description: 'Cine familiar',
          merchant: 'Cinemark',
          paymentMethod: 'cash' as const,
          tags: [],
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        }
      ];

      for (const expense of demoExpenses) {
        await addExpense(expense);
      }

      toast({
        title: "¡Datos demo generados!",
        description: "Se crearon presupuestos y gastos consistentes",
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
            disabled={isClearing}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {isClearing ? 'Limpiando...' : 'Limpiar'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
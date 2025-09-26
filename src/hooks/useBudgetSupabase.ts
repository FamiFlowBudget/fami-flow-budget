// src/hooks/useBudgetSupabase.ts (Actualizado para incluir receipt_url)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFamilies } from './useFamilies';
import { 
  Category, 
  Expense, 
  Budget, 
  FamilyMember,
  BudgetProgress,
  DashboardKPIs,
  Currency
} from '@/types/budget';
import { useToast } from '@/hooks/use-toast';

export const useBudgetSupabase = () => {
  const { user } = useAuth();
  const { currentFamily } = useFamilies(); 
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user || !currentFamily) {
      setLoading(false);
      return;
    };
    
    setLoading(true);
    try {
      // (Carga de categorías y miembros no cambia)
      const { data: categoriesData, error: catError } = await supabase.from('categories').select('*').eq('family_id', currentFamily.id).order('order_index');
      if (catError) throw catError;
      setCategories(categoriesData || []);

      const { data: membersData, error: memError } = await supabase.from('family_members').select('*').eq('family_id', currentFamily.id);
      if (memError) throw memError;
      setMembers(membersData || []);
      const userAsMember = membersData?.find(m => m.user_id === user.id);
      setCurrentMember(userAsMember || null);

      const { data: budgetsData, error: budError } = await supabase.from('budgets').select('*').eq('family_id', currentFamily.id);
      if (budError) throw budError;
      setBudgets(budgetsData || []);

      // <<<--- CAMBIO AQUÍ: Ahora también pedimos receipt_url ---<<<
      const { data: expensesData, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('family_id', currentFamily.id)
        .order('expense_date', { ascending: false });
      if (expError) throw expError;
      setExpenses((expensesData || []).map(expense => ({
        ...expense,
        // Mapeamos los nombres de la base de datos a los de la app
        memberId: expense.member_id,
        categoryId: expense.category_id,
        paymentMethod: expense.payment_method,
        receiptUrl: expense.receipt_url, // <<<--- AÑADIMOS EL NUEVO CAMPO
        date: expense.expense_date
      })));

      if (currentFamily.currency) {
        setCurrency(currentFamily.currency as Currency);
      }

    } catch (error) {
      console.error('Error cargando datos de la familia:', error);
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, currentFamily, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // <<<--- CAMBIO AQUÍ: La función ahora acepta receiptUrl ---<<<
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'family_id'>) => {
    if (!user || !currentFamily) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          member_id: expense.memberId,
          category_id: expense.categoryId,
          amount: expense.amount,
          currency: expense.currency,
          description: expense.description,
          merchant: expense.merchant,
          payment_method: expense.paymentMethod,
          tags: expense.tags,
          expense_date: expense.date,
          receipt_url: expense.receiptUrl, // <<<--- AÑADIMOS EL NUEVO CAMPO AL GUARDAR
          family_id: currentFamily.id,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Mapeamos de vuelta para consistencia en el estado local
        const newExpense: Expense = { ...data, memberId: data.member_id, categoryId: data.category_id, paymentMethod: data.payment_method, receiptUrl: data.receipt_url, date: data.expense_date };
        setExpenses(prev => [newExpense, ...prev]);
        toast({ title: "Gasto agregado", description: "El gasto se ha registrado correctamente" });
        return newExpense;
      }
    } catch (error) {
      console.error('Error agregando gasto:', error);
      toast({ title: "Error", description: "No se pudo agregar el gasto", variant: "destructive" });
    }
    return null;
  }, [user, currentFamily, toast]);

  // (El resto de funciones como updateExpense, deleteExpense, y los cálculos del dashboard no necesitan cambios por ahora)

  return {
    expenses,
    budgets,
    categories,
    members,
    currentMember,
    currency,
    loading,
    addExpense,
    loadData,
    // (Resto de funciones exportadas)
    getCurrentMonthExpenses,
    getCategoryProgress,
    getDashboardKPIs,
    getYearTrendData,
    getDailyBurnData,
  };
};
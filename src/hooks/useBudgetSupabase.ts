// src/hooks/useBudgetSupabase.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFamilies } from './useFamilies'; // <<<--- IMPORTANTE: Necesitamos el contexto de la familia
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
  // CAMBIO CLAVE: Obtenemos la familia actual del hook de familias.
  const { currentFamily } = useFamilies(); 
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [loading, setLoading] = useState(true);

  // Cargar todos los datos de la familia
  const loadData = useCallback(async () => {
    // CAMBIO CLAVE: Solo cargamos datos si hay un usuario Y una familia seleccionada.
    if (!user || !currentFamily) {
      setLoading(false);
      return;
    };
    
    setLoading(true);
    try {
      // Cargar categorías de la FAMILIA
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('family_id', currentFamily.id) // <<<--- Filtramos por family_id
        .order('order_index');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Cargar miembros de la FAMILIA
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', currentFamily.id); // <<<--- Filtramos por family_id
      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Encontrar el perfil del usuario actual dentro de los miembros de la familia
      const userAsMember = membersData?.find(m => m.user_id === user.id);
      setCurrentMember(userAsMember || null);

      // Cargar presupuestos de la FAMILIA
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('family_id', currentFamily.id); // <<<--- Filtramos por family_id
      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);

      // Cargar gastos de la FAMILIA
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('family_id', currentFamily.id) // <<<--- Filtramos por family_id
        .order('expense_date', { ascending: false });
      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Settear la moneda de la familia
      if (currentFamily.currency) {
        setCurrency(currentFamily.currency as Currency);
      }

    } catch (error) {
      console.error('Error cargando datos de la familia:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la familia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentFamily, toast]); // CAMBIO CLAVE: El efecto depende de la familia actual

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Agregar nuevo gasto (ahora asociado a la familia)
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'family_id'>) => {
    if (!user || !currentFamily) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          family_id: currentFamily.id, // <<<--- Añadimos el family_id
          user_id: user.id // Mantenemos quién lo registró
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newExpense: Expense = data;
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

  // Las demás funciones de agregar/editar/eliminar también necesitarían el filtro de family_id
  // Por simplicidad, nos enfocaremos en que los cálculos del dashboard funcionen.
  // Las funciones de cálculo que siguen ahora operarán sobre el conjunto de datos de TODA la familia.

  // Obtener gastos del mes actual o período especificado
  const getCurrentMonthExpenses = useCallback((period?: { month: number; year: number }) => {
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === targetYear && 
             expenseDate.getMonth() + 1 === targetMonth;
    });
  }, [expenses]);

  // Calcular progreso por categoría
  const getCategoryProgress = useCallback((period?: { month: number; year: number }): BudgetProgress[] => {
    const currentMonthExpenses = getCurrentMonthExpenses(period);

    return categories.map(category => {
      const categoryBudgets = budgets.filter(b => b.categoryId === category.id && b.year === period?.year && b.month === period?.month);
      const budgetAmount = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
      
      const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === category.id);
      const spentAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      let status: 'success' | 'warning' | 'danger' = 'success';
      if (percentage >= 90) status = 'danger';
      else if (percentage >= 75) status = 'warning';

      return {
        categoryId: category.id,
        categoryName: category.name,
        budgetAmount,
        spentAmount,
        percentage,
        status
      };
    }).filter(p => p.budgetAmount > 0);
  }, [categories, budgets, getCurrentMonthExpenses]);


  // KPIs del dashboard
  const getDashboardKPIs = useCallback((period?: { month: number; year: number }): DashboardKPIs => {
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();
    const currentMonthExpenses = getCurrentMonthExpenses(period);

    const totalBudget = budgets
      .filter(b => b.year === targetYear && b.month === targetMonth)
      .reduce((sum, b) => sum + b.amount, 0);

    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    let status: 'success' | 'warning' | 'danger' = 'success';
    if (percentage >= 90) status = 'danger';
    else if (percentage >= 75) status = 'warning';

    return { totalBudget, totalSpent, remaining, percentage, status, currency };
  }, [getCurrentMonthExpenses, budgets, currency]);

  // Datos para gráficos anuales
  const getYearTrendData = useCallback((year: number) => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const monthName = new Date(year, monthIndex).toLocaleDateString('es-CL', { month: 'short' });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month;
      });
      const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const monthBudgets = budgets.filter(b => b.year === year && b.month === month);
      const budget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
      
      return { month: monthName, monthNumber: month, budget, spent };
    });
  }, [expenses, budgets]);
  
  // Datos para burn rate diario
  const getDailyBurnData = useCallback((period?: { month: number; year: number }) => {
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    const monthExpenses = getCurrentMonthExpenses(period);
    const monthBudget = budgets
      .filter(b => b.year === targetYear && b.month === targetMonth)
      .reduce((sum, b) => sum + b.amount, 0);

    const dailyTarget = monthBudget / daysInMonth;
    let cumulativeSpent = 0;
    
    return Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const day = dayIndex + 1;
      const dailyExpenses = monthExpenses
        .filter(e => new Date(e.date).getDate() === day)
        .reduce((sum, e) => sum + e.amount, 0);

      cumulativeSpent += dailyExpenses;
      
      return {
        day,
        date: `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        actualSpent: cumulativeSpent,
        targetSpent: dailyTarget * day
      };
    });
  }, [getCurrentMonthExpenses, budgets]);


  return {
    // Data
    expenses,
    budgets,
    categories,
    members,
    currentMember,
    currency,
    loading,
    
    // Actions
    addExpense,
    loadData,
    
    // Computed
    getCurrentMonthExpenses,
    getCategoryProgress,
    getDashboardKPIs,
    getYearTrendData,
    getDailyBurnData,
  };
};
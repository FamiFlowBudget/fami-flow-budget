// src/hooks/useBudgetSupabase.ts (CON LÓGICA JERÁRQUICA Y ALERTAS)

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

// Nueva interfaz para los datos jerárquicos
export interface HierarchicalBudgetProgress extends BudgetProgress {
  subcategories: BudgetProgress[];
}

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

      const { data: expensesData, error: expError } = await supabase.from('expenses').select('*').eq('family_id', currentFamily.id).order('expense_date', { ascending: false });
      if (expError) throw expError;
      setExpenses((expensesData || []).map(expense => ({
        ...expense,
        memberId: expense.member_id,
        categoryId: expense.category_id,
        paymentMethod: expense.payment_method,
        receiptUrl: expense.receipt_url,
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

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'family_id'>) => {
    if (!user || !currentFamily) return null;
    try {
      const { data, error } = await supabase.from('expenses').insert({
        member_id: expense.memberId, category_id: expense.categoryId, amount: expense.amount, currency: expense.currency,
        description: expense.description, merchant: expense.merchant, payment_method: expense.paymentMethod,
        tags: expense.tags, expense_date: expense.date, receipt_url: expense.receiptUrl,
        family_id: currentFamily.id, user_id: user.id
      }).select().single();
      if (error) throw error;
      if (data) {
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

  const cleanDuplicateCategories = useCallback(async () => {
    if (!currentFamily) return;

    setLoading(true);
    try {
      const { data: allCategories, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('family_id', currentFamily.id);

      if (fetchError) throw fetchError;

      const uniqueCategories = new Map<string, Category>();
      const mergeMap = new Map<string, string>(); // Map<duplicateId, primaryId>

      for (const category of allCategories) {
        const key = `${category.name.trim().toLowerCase()}-${category.parent_id || 'null'}`;
        if (uniqueCategories.has(key)) {
          const primaryCategory = uniqueCategories.get(key)!;
          mergeMap.set(category.id, primaryCategory.id);
        } else {
          uniqueCategories.set(key, category);
        }
      }

      if (mergeMap.size === 0) {
        toast({ title: "Sin duplicados", description: "No se encontraron categorías duplicadas." });
        setLoading(false);
        return;
      }

      // Re-asociar gastos y presupuestos
      const updatePromises = [];
      for (const [duplicateId, primaryId] of mergeMap.entries()) {
        updatePromises.push(
          supabase.from('expenses').update({ category_id: primaryId }).eq('category_id', duplicateId)
        );
        updatePromises.push(
          supabase.from('budgets').update({ category_id: primaryId }).eq('category_id', duplicateId)
        );
      }

      const results = await Promise.all(updatePromises);
      const updateError = results.find(res => res.error);
      if (updateError) throw updateError.error;

      // Eliminar los duplicados
      const duplicatesToDelete = Array.from(mergeMap.keys());
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .in('id', duplicatesToDelete);

      if (deleteError) throw deleteError;

      // Recargar todos los datos para asegurar la consistencia
      await loadData();

      toast({
        title: "Limpieza completada",
        description: `Se fusionaron y eliminaron ${duplicatesToDelete.length} categorías duplicadas.`,
        variant: "success",
      });

    } catch (error) {
      console.error('Error limpiando categorías duplicadas:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la limpieza de duplicados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentFamily, toast, loadData]);

  const getCurrentMonthExpenses = useCallback((period?: { month: number; year: number }) => {
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === targetYear && expenseDate.getMonth() + 1 === targetMonth;
    });
  }, [expenses]);

  const getHierarchicalCategoryProgress = useCallback((period?: { month: number; year: number }): HierarchicalBudgetProgress[] => {
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();
    const currentMonthExpenses = getCurrentMonthExpenses(period);

    const mainCategories = categories.filter(cat => !cat.parentId);

    const hierarchicalData = mainCategories.map(mainCat => {
      const subcategories = categories.filter(sub => sub.parentId === mainCat.id);

      const processedSubcategories: BudgetProgress[] = subcategories.map(subCat => {
        const subBudget = budgets
          .filter(b => b.categoryId === subCat.id && b.year === targetYear && b.month === targetMonth)
          .reduce((sum, b) => sum + b.amount, 0);
        
        const subSpent = currentMonthExpenses
          .filter(e => e.categoryId === subCat.id)
          .reduce((sum, e) => sum + e.amount, 0);

        const percentage = subBudget > 0 ? (subSpent / subBudget) * 100 : 0;
        let status: 'danger' | 'warning' | 'success' = 'success';
        if (percentage >= 100) status = 'danger';
        else if (percentage >= 80) status = 'warning';

        return {
          categoryId: subCat.id, categoryName: subCat.name,
          budgetAmount: subBudget, spentAmount: subSpent,
          percentage, status
        };
      });

      const mainBudgetDirect = budgets
        .filter(b => b.categoryId === mainCat.id && b.year === targetYear && b.month === targetMonth)
        .reduce((sum, b) => sum + b.amount, 0);
      
      const mainSpentDirect = currentMonthExpenses
        .filter(e => e.categoryId === mainCat.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalBudget = mainBudgetDirect + processedSubcategories.reduce((sum, sub) => sum + sub.budgetAmount, 0);
      const totalSpent = mainSpentDirect + processedSubcategories.reduce((sum, sub) => sum + sub.spentAmount, 0);
      
      const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      let totalStatus: 'danger' | 'warning' | 'success' = 'success';
      if (totalPercentage >= 100) totalStatus = 'danger';
      else if (totalPercentage >= 80) totalStatus = 'warning';

      processedSubcategories.sort((a, b) => {
        if (a.spentAmount > 0 || b.spentAmount > 0) return b.spentAmount - a.spentAmount;
        return b.budgetAmount - a.budgetAmount;
      });

      return {
        categoryId: mainCat.id, categoryName: mainCat.name,
        budgetAmount: totalBudget, spentAmount: totalSpent,
        percentage: totalPercentage, status: totalStatus,
        subcategories: processedSubcategories
      };
    });

    hierarchicalData.sort((a, b) => {
      if (a.spentAmount > 0 || b.spentAmount > 0) return b.spentAmount - a.spentAmount;
      return b.budgetAmount - a.budgetAmount;
    });

    return hierarchicalData;
  }, [categories, budgets, expenses, getCurrentMonthExpenses]);

  const getDashboardKPIs = useCallback((period?: { month: number; year: number }): DashboardKPIs => {
    const currentMonthExpenses = getCurrentMonthExpenses(period);
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();

    // Presupuesto total del mes
    const totalBudget = budgets
      .filter(b => b.year === targetYear && b.month === targetMonth)
      .reduce((sum, b) => sum + b.amount, 0);

    // Gasto total del mes
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    let status: 'success' | 'warning' | 'danger' = 'success';
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage,
      status,
      currency,
    };
  }, [getCurrentMonthExpenses, budgets, currency]);

  const getCategoryProgress = useCallback((period?: { month: number; year: number }): BudgetProgress[] => {
    const currentMonthExpenses = getCurrentMonthExpenses(period);
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();

    return categories.map(category => {
      // Buscar presupuesto para esta categoría/mes
      const budget = budgets.find(b =>
        b.categoryId === category.id &&
        b.year === targetYear &&
        b.month === targetMonth
      );

      // Sumar gastos de esta categoría
      const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === category.id);
      const spentAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

      const budgetAmount = budget?.amount || 0;
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
        status,
      };
    }).filter(p => p.budgetAmount > 0); // Solo mostrar categorías con presupuesto
  }, [categories, budgets, getCurrentMonthExpenses]);

  const getYearTrendData = useCallback(() => {
    const trendData: { month: string; budget: number; spent: number }[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 1; i <= 12; i++) {
      const monthName = new Date(currentYear, i - 1, 1).toLocaleString('default', { month: 'short' });
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() + 1 === i;
      });
      const monthlyBudget = budgets
        .filter(b => b.year === currentYear && b.month === i)
        .reduce((sum, b) => sum + b.amount, 0);
      const monthlySpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      trendData.push({ month: monthName, budget: monthlyBudget, spent: monthlySpent });
    }
    return trendData;
  }, [expenses, budgets]);

  const getFamilyDataByCategory = useCallback((period?: { month: number; year: number }) => {
    const currentMonthExpenses = getCurrentMonthExpenses(period);
    return categories.map(category => {
      const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === category.id);
      const familySpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const memberData = members.map(member => {
        const memberExpenses = categoryExpenses.filter(e => e.memberId === member.id);
        const spentAmount = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = familySpent > 0 ? (spentAmount / familySpent) * 100 : 0;
        return {
          member,
          spentAmount,
          percentage
        };
      });
      return {
        category,
        familySpent,
        memberData
      };
    }).filter(data => data.familySpent > 0);
  }, [categories, members, getCurrentMonthExpenses]);


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
    getHierarchicalCategoryProgress,
    getDashboardKPIs,
    cleanDuplicateCategories,
    getCategoryProgress,
    getYearTrendData,
    getFamilyDataByCategory,
    getCurrentMonthExpenses,
    // (Resto de funciones que ya tenías)
  };
};
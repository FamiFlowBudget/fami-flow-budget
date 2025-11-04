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
    if (!budgets.length || !expenses.length) {
      return { totalBudget: 0, totalSpent: 0, exceeded: 0, progress: 0 };
    }
    const currentMonthExpenses = getCurrentMonthExpenses(period);
    const targetMonth = period?.month || (new Date().getMonth() + 1);
    const targetYear = period?.year || new Date().getFullYear();

    const totalSpent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Considerar solo los presupuestos de categorías principales
    const mainCategoryIds = categories.filter(c => !c.parentId).map(c => c.id);
    const subCategoryIds = categories.filter(c => c.parentId).map(c => c.id);

    const totalBudget = budgets
      .filter(b => b.year === targetYear && b.month === targetMonth)
      .reduce((sum, b) => {
        // Solo sumar si es una categoría principal o una subcategoría que no tiene su principal presupuestada
        const category = categories.find(c => c.id === b.categoryId);
        if (category && (mainCategoryIds.includes(category.id) || !mainCategoryIds.includes(category.parentId!))) {
          return sum + b.amount;
        }
        return sum;
      }, 0);

    const exceeded = totalSpent > totalBudget ? totalSpent - totalBudget : 0;
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { totalBudget, totalSpent, exceeded, progress };
  }, [budgets, expenses, categories, getCurrentMonthExpenses]);

  const getYearTrendData = useCallback(() => {
    const yearlyData: { [key: string]: { budget: number, spent: number } } = {};
    const currentYear = new Date().getFullYear();

    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'short' });

      const monthlyExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() + 1 === month;
      }).reduce((sum, e) => sum + e.amount, 0);

      const monthlyBudget = budgets.filter(b => b.year === currentYear && b.month === month)
        .reduce((sum, b) => sum + b.amount, 0);

      yearlyData[monthName] = { budget: monthlyBudget, spent: monthlyExpenses };
    }

    return Object.entries(yearlyData).map(([name, values]) => ({ name, ...values }));
  }, [expenses, budgets]);

  const getDailyBurnData = useCallback((period?: { month: number; year: number }) => {
    const currentMonthExpenses = getCurrentMonthExpenses(period);
    const daysInMonth = new Date(period?.year || new Date().getFullYear(), period?.month || new Date().getMonth() + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0 }));

    currentMonthExpenses.forEach(expense => {
      const dayOfMonth = new Date(expense.date).getDate();
      dailyData[dayOfMonth - 1].total += expense.amount;
    });

    return dailyData;
  }, [getCurrentMonthExpenses]);


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
    getYearTrendData,
    getDailyBurnData
  };
};
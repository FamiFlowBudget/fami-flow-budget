import { useState, useEffect, useCallback } from 'react';
import { 
  Category, 
  Expense, 
  Budget, 
  FamilyMember, 
  DEFAULT_CATEGORIES, 
  BudgetProgress,
  DashboardKPIs,
  STORAGE_KEYS,
  Currency
} from '@/types/budget';

// Hook principal para manejar datos del presupuesto
// Usa localStorage mientras se conecta Supabase
export const useBudgetData = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [currency] = useState<Currency>('CLP');

  // Inicializar datos desde localStorage
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);

      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
      
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // Inicializar con categorías por defecto
        const defaultCats: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
          ...cat,
          id: `cat_${index + 1}`
        }));
        setCategories(defaultCats);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCats));
      }

      if (storedMembers) {
        const parsedMembers = JSON.parse(storedMembers);
        setMembers(parsedMembers);
        setCurrentMember(parsedMembers[0] || null);
      } else {
        // Usuario demo por defecto
        const demoMember: FamilyMember = {
          id: 'member_1',
          name: 'Usuario Demo',
          email: 'demo@familia.cl',
          role: 'admin',
          active: true
        };
        setMembers([demoMember]);
        setCurrentMember(demoMember);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([demoMember]));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, []);

  // Guardar expenses cuando cambian
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  // Guardar budgets cuando cambian
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  // Agregar nuevo gasto
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  }, []);

  // Obtener gastos del mes actual
  const getCurrentMonthExpenses = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === currentYear && 
             expenseDate.getMonth() + 1 === currentMonth;
    });
  }, [expenses]);

  // Calcular progreso por categoría
  const getCategoryProgress = useCallback((): BudgetProgress[] => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return categories.map(category => {
      // Buscar presupuesto para esta categoría/mes
      const budget = budgets.find(b => 
        b.categoryId === category.id && 
        b.year === currentYear && 
        b.month === currentMonth
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

  // KPIs del dashboard
  const getDashboardKPIs = useCallback((): DashboardKPIs => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Presupuesto total del mes
    const totalBudget = budgets
      .filter(b => b.year === currentYear && b.month === currentMonth)
      .reduce((sum, b) => sum + b.amount, 0);

    // Gasto total del mes
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    let status: 'success' | 'warning' | 'danger' = 'success';
    if (percentage >= 90) status = 'danger';
    else if (percentage >= 75) status = 'warning';

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage,
      status,
      currency,
    };
  }, [getCurrentMonthExpenses, budgets, currency]);

  return {
    // Data
    expenses,
    budgets,
    categories,
    members,
    currentMember,
    currency,
    
    // Actions
    addExpense,
    
    // Computed
    getCurrentMonthExpenses,
    getCategoryProgress,
    getDashboardKPIs,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [currency] = useState<Currency>('CLP');
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Cargar categorías
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('order_index');

      if (!categoriesData || categoriesData.length === 0) {
        // Configurar categorías por defecto
        await supabase.rpc('setup_default_categories_for_user', { user_uuid: user.id });
        const { data: newCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('active', true)
          .order('order_index');
        setCategories((newCategories || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          parentId: cat.parent_id,
          order: cat.order_index
        })));
      } else {
        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          parentId: cat.parent_id,
          order: cat.order_index
        })));
      }

      // Cargar miembros de la familia
      const { data: membersData } = await supabase
        .from('family_members')
        .select('*')
        .eq('active', true);

      if (!membersData || membersData.length === 0) {
        // Crear miembro por defecto
        const { data: newMember } = await supabase
          .from('family_members')
          .insert({
            user_id: user.id,
            name: user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            role: 'admin'
          })
          .select()
          .single();
        
        if (newMember) {
          const mappedMember = {
            id: newMember.id,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role as 'admin' | 'adult' | 'kid',
            photoUrl: newMember.photo_url,
            active: newMember.active
          };
          setMembers([mappedMember]);
          setCurrentMember(mappedMember);
        }
      } else {
        const mappedMembers = membersData.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role as 'admin' | 'adult' | 'kid',
          photoUrl: member.photo_url,
          active: member.active
        }));
        setMembers(mappedMembers);
        setCurrentMember(mappedMembers[0]);
      }

      // Cargar presupuestos
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*');
      setBudgets((budgetsData || []).map(budget => ({
        id: budget.id,
        categoryId: budget.category_id,
        memberId: budget.member_id,
        year: budget.year,
        month: budget.month,
        amount: budget.amount,
        currency: budget.currency as Currency
      })));

      // Cargar gastos
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      setExpenses((expensesData || []).map(expense => ({
        id: expense.id,
        memberId: expense.member_id,
        categoryId: expense.category_id,
        amount: expense.amount,
        currency: expense.currency as Currency,
        description: expense.description,
        merchant: expense.merchant,
        paymentMethod: expense.payment_method as 'cash' | 'debit' | 'credit' | 'transfer' | 'other',
        tags: expense.tags,
        date: expense.expense_date,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at
      })));

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Agregar nuevo gasto
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          member_id: expense.memberId,
          category_id: expense.categoryId,
          amount: expense.amount,
          currency: expense.currency,
          description: expense.description,
          merchant: expense.merchant,
          payment_method: expense.paymentMethod,
          tags: expense.tags,
          expense_date: expense.date
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newExpense: Expense = {
          id: data.id,
          memberId: data.member_id,
          categoryId: data.category_id,
          amount: data.amount,
          currency: data.currency as Currency,
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.payment_method as 'cash' | 'debit' | 'credit' | 'transfer' | 'other',
          tags: data.tags,
          date: data.expense_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setExpenses(prev => [newExpense, ...prev]);
        
        toast({
          title: "Gasto agregado",
          description: "El gasto se ha registrado correctamente",
        });
        
        return newExpense;
      }
    } catch (error) {
      console.error('Error agregando gasto:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto",
        variant: "destructive",
      });
    }
    return null;
  }, [user, toast]);

  // Agregar nueva categoría
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          parent_id: category.parentId,
          order_index: category.order
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCategory: Category = {
          id: data.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          parentId: data.parent_id,
          order: data.order_index
        };
        
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.order - b.order));
        
        toast({
          title: "Categoría agregada",
          description: "La categoría se ha creado correctamente",
        });
        
        return newCategory;
      }
    } catch (error) {
      console.error('Error agregando categoría:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría",
        variant: "destructive",
      });
    }
    return null;
  }, [user, toast]);

  // Agregar/actualizar presupuesto
  const upsertBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          category_id: budget.categoryId,
          member_id: budget.memberId,
          year: budget.year,
          month: budget.month,
          amount: budget.amount,
          currency: budget.currency
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newBudget: Budget = {
          id: data.id,
          categoryId: data.category_id,
          memberId: data.member_id,
          year: data.year,
          month: data.month,
          amount: data.amount,
          currency: data.currency as Currency
        };
        
        setBudgets(prev => {
          const filtered = prev.filter(b => 
            !(b.categoryId === newBudget.categoryId && 
              b.memberId === newBudget.memberId && 
              b.year === newBudget.year && 
              b.month === newBudget.month)
          );
          return [...filtered, newBudget];
        });
        
        toast({
          title: "Presupuesto actualizado",
          description: "El presupuesto se ha guardado correctamente",
        });
        
        return newBudget;
      }
    } catch (error) {
      console.error('Error actualizando presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto",
        variant: "destructive",
      });
    }
    return null;
  }, [user, toast]);

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
      const budget = budgets.find(b => 
        b.categoryId === category.id && 
        b.year === currentYear && 
        b.month === currentMonth
      );

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
    }).filter(p => p.budgetAmount > 0);
  }, [categories, budgets, getCurrentMonthExpenses]);

  // KPIs del dashboard
  const getDashboardKPIs = useCallback((): DashboardKPIs => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalBudget = budgets
      .filter(b => b.year === currentYear && b.month === currentMonth)
      .reduce((sum, b) => sum + b.amount, 0);

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
    loading,
    
    // Actions
    addExpense,
    addCategory,
    upsertBudget,
    loadData,
    
    // Computed
    getCurrentMonthExpenses,
    getCategoryProgress,
    getDashboardKPIs,
  };
};
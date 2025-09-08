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

  // Función para actualizar perfil del miembro
  const updateMemberProfile = async (updates: { name?: string; photoUrl?: string }) => {
    if (!currentMember) throw new Error('No current member');
    
    const { error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', currentMember.id);

    if (error) throw error;

    // Actualizar estado local
    setCurrentMember(prev => prev ? { ...prev, ...updates } : null);
    setMembers(prev => prev.map(member => 
      member.id === currentMember.id 
        ? { ...member, ...updates }
        : member
    ));
  };

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

  // Actualizar categoría existente
  const updateCategory = useCallback(async (categoryId: string, updates: Partial<Omit<Category, 'id'>>) => {
    if (!user) return null;

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.icon) updateData.icon = updates.icon;
      if (updates.color) updateData.color = updates.color;
      if (updates.order !== undefined) updateData.order_index = updates.order;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedCategory: Category = {
          id: data.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          order: data.order_index,
          parentId: data.parent_id
        };

        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? updatedCategory : cat
        ).sort((a, b) => a.order - b.order));
        
        toast({
          title: "Categoría actualizada",
          description: "Los cambios se han guardado correctamente",
        });
        
        return updatedCategory;
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    }
    return null;
  }, [user, toast]);

  // Eliminar categoría
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return false;

    try {
      // Verificar si hay gastos asociados a esta categoría
      const { count: expenseCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('user_id', user.id);

      // Verificar si hay presupuestos asociados a esta categoría
      const { count: budgetCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('user_id', user.id);

      // Si hay gastos o presupuestos asociados, no permitir eliminar
      if ((expenseCount && expenseCount > 0) || (budgetCount && budgetCount > 0)) {
        const hasExpenses = expenseCount && expenseCount > 0;
        const hasBudgets = budgetCount && budgetCount > 0;
        
        let message = 'No se puede eliminar la categoría porque tiene ';
        if (hasExpenses && hasBudgets) {
          message += `${expenseCount} gastos y ${budgetCount} presupuestos asociados`;
        } else if (hasExpenses) {
          message += `${expenseCount} gastos asociados`;
        } else {
          message += `${budgetCount} presupuestos asociados`;
        }
        
        throw new Error(message);
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      return true;
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      throw error; // Re-throw para que el componente maneje el error
    }
  }, [user]);

  // Función para limpiar categorías duplicadas
  const cleanDuplicateCategories = useCallback(async () => {
    if (!user) return false;

    try {
      // Obtener categorías duplicadas manualmente
      const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (!allCategories) return false;

      // Agrupar por nombre para encontrar duplicados
      const categoryGroups = allCategories.reduce((groups, cat) => {
        if (!groups[cat.name]) {
          groups[cat.name] = [];
        }
        groups[cat.name].push(cat);
        return groups;
      }, {} as Record<string, typeof allCategories>);

      // Encontrar duplicados (grupos con más de 1 categoría)
      const duplicatesInfo: Array<{original_id: string, duplicate_id: string, name: string}> = [];
      
      Object.entries(categoryGroups).forEach(([name, cats]) => {
        if (cats.length > 1) {
          // La primera (más antigua) es la original, las demás son duplicados
          const original = cats[0];
          cats.slice(1).forEach(duplicate => {
            duplicatesInfo.push({
              original_id: original.id,
              duplicate_id: duplicate.id,
              name: name
            });
          });
        }
      });

      if (duplicatesInfo.length === 0) {
        toast({
          title: "Sin duplicados",
          description: "No se encontraron categorías duplicadas",
        });
        return true;
      }

      // Mover referencias de duplicados a originales
      for (const dup of duplicatesInfo) {
        // Actualizar gastos
        await supabase
          .from('expenses')
          .update({ category_id: dup.original_id })
          .eq('category_id', dup.duplicate_id)
          .eq('user_id', user.id);

        // Actualizar presupuestos
        await supabase
          .from('budgets')
          .update({ category_id: dup.original_id })
          .eq('category_id', dup.duplicate_id)
          .eq('user_id', user.id);

        // Eliminar categoría duplicada
        await supabase
          .from('categories')
          .delete()
          .eq('id', dup.duplicate_id)
          .eq('user_id', user.id);
      }

      // Recargar categorías
      await loadData();

      toast({
        title: "Duplicados eliminados",
        description: `Se eliminaron ${duplicatesInfo.length} categorías duplicadas`,
      });

      return true;
    } catch (error) {
      console.error('Error limpiando duplicados:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los duplicados",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, loadData]);

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

  // Calcular progreso por categoría con desglose familiar
  const getCategoryProgress = useCallback((): BudgetProgress[] => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return categories.map(category => {
      // Buscar todos los presupuestos de esta categoría para el mes actual
      const categoryBudgets = budgets.filter(b => 
        b.categoryId === category.id && 
        b.year === currentYear && 
        b.month === currentMonth
      );

      // Sumar gastos de esta categoría
      const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === category.id);
      const spentAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Sumar presupuestos familiares
      const budgetAmount = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
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

  // KPIs del dashboard con totales familiares
  const getDashboardKPIs = useCallback((): DashboardKPIs => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Presupuesto total del mes (suma de todos los miembros)
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

  // Obtener datos familiares por categoría
  const getFamilyDataByCategory = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthExpenses = getCurrentMonthExpenses();

    return categories.map(category => {
      // Presupuestos por miembro para esta categoría
      const categoryBudgets = budgets.filter(b => 
        b.categoryId === category.id && 
        b.year === currentYear && 
        b.month === currentMonth
      );

      // Gastos por miembro para esta categoría
      const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === category.id);

      // Datos por miembro
      const memberData = members.map(member => {
        const memberBudget = categoryBudgets.find(b => b.memberId === member.id);
        const memberExpenses = categoryExpenses.filter(e => e.memberId === member.id);
        const spentAmount = memberExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          member,
          budgetAmount: memberBudget?.amount || 0,
          spentAmount,
          percentage: memberBudget?.amount > 0 ? (spentAmount / memberBudget.amount) * 100 : 0
        };
      });

      // Totales familiares
      const familyBudget = memberData.reduce((sum, md) => sum + md.budgetAmount, 0);
      const familySpent = memberData.reduce((sum, md) => sum + md.spentAmount, 0);
      const familyPercentage = familyBudget > 0 ? (familySpent / familyBudget) * 100 : 0;

      return {
        category,
        memberData,
        familyBudget,
        familySpent,
        familyPercentage,
        hasData: familyBudget > 0
      };
    }).filter(cd => cd.hasData);
  }, [categories, budgets, members, getCurrentMonthExpenses]);

  // Calcular datos para gráficos anuales
  const getYearTrendData = useCallback(() => {
    const currentYear = new Date().getFullYear();
    
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const monthName = new Date(0, monthIndex).toLocaleDateString('es-CL', { month: 'short' });
      
      // Gastos del mes
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear && 
               expenseDate.getMonth() + 1 === month;
      });
      const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Presupuesto del mes
      const monthBudgets = budgets.filter(b => 
        b.year === currentYear && b.month === month
      );
      const budget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
      
      return {
        month: monthName,
        monthNumber: month,
        budget,
        spent,
        budgetCumulative: budget * month, // Simplificado
        spentCumulative: spent * month, // Simplificado
      };
    });
  }, [expenses, budgets]);

  // Calcular datos para burn rate diario
  const getDailyBurnData = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const monthExpenses = getCurrentMonthExpenses();
    const monthBudgets = budgets.filter(b => 
      b.year === currentYear && b.month === currentMonth
    );
    const monthBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
    const dailyTarget = monthBudget / daysInMonth;
    
    return Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const day = dayIndex + 1;
      const dayExpenses = monthExpenses.filter(expense => {
        const expenseDay = new Date(expense.date).getDate();
        return expenseDay <= day;
      });
      const actualSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const targetSpent = dailyTarget * day;
      
      return {
        day,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        actualSpent,
        targetSpent
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
    addCategory,
    updateCategory,
    deleteCategory,
    cleanDuplicateCategories,
    upsertBudget,
    loadData,
    updateMemberProfile,
    
    // Computed
    getCurrentMonthExpenses,
    getCategoryProgress,
    getDashboardKPIs,
    getFamilyDataByCategory,
    getYearTrendData,
    getDailyBurnData,
  };
};
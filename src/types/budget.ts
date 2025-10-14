// src/types/budget.ts (Versión Completa y Corregida)

export type Currency = 'USD' | 'CLP' | 'EUR';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other';
export type FamilyMemberRole = 'admin' | 'adult' | 'kid';

// <<<--- FUNCIÓN RESTAURADA ---<<<
// Helper function to format currency
export const formatCurrency = (amount: number, currency: Currency = 'CLP') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  order: number;
}

export interface Expense {
  id: string;
  memberId: string;
  categoryId: string;
  amount: number;
  currency: Currency;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  date: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  memberId: string | null;
  year: number;
  month: number;
  amount: number;
  currency: Currency;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: FamilyMemberRole;
  photoUrl?: string;
  active: boolean;
  userId?: string;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
}

export interface HierarchicalBudgetProgress extends BudgetProgress {
  subcategories: BudgetProgress[];
}

export interface DashboardKPIs {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  currency: Currency;
  expenseCount?: number;
}

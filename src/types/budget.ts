// Tipos para el sistema de presupuestos familiares multi-familia
// Actualizado para soportar múltiples familias con roles y gestión de miembros

export type Currency = 'CLP' | 'USD' | 'EUR';

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other';

export type FamilyMemberRole = 'admin' | 'editor' | 'visitor';

export type FamilyMemberStatus = 'active' | 'pending' | 'revoked';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Family {
  id: string;
  name: string;
  familyPublicId: string;
  currency: Currency;
  timezone: string;
  joinPinHash?: string;
  invitationPolicy: {
    requirePin: boolean;
    defaultRoleOnInvite: 'editor' | 'visitor';
    tokenExpiryDays: number;
    allowEditorImports: boolean;
    allowEditorReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  parentId?: string;
  order: number;
  familyId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: FamilyMemberRole;
  photoUrl?: string;
  active: boolean;
  familyId?: string;
  status: FamilyMemberStatus;
}

export interface UserFamily {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;
  joinedAt: string;
  family?: Family;
}

export interface JoinRequest {
  id: string;
  familyId: string;
  requesterUserId?: string;
  email: string;
  message?: string;
  status: JoinRequestStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  familyId: string;
  token: string;
  emailAllowlist?: string;
  suggestedRole: FamilyMemberRole;
  expiresAt: string;
  usesRemaining: number;
  createdBy: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId?: string;
  memberId?: string;
  year: number;
  month?: number; // 1-12 para mensual, null para anual
  amount: number;
  currency: Currency;
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
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger'; // Semáforo
}

export interface DashboardKPIs {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  currency: Currency;
}

// Categorías iniciales del sistema
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Hogar', icon: 'Home', color: 'blue', order: 1 },
  { name: 'Alimentación', icon: 'ShoppingCart', color: 'green', order: 2 },
  { name: 'Transporte', icon: 'Car', color: 'yellow', order: 3 },
  { name: 'Educación', icon: 'GraduationCap', color: 'indigo', order: 4 },
  { name: 'Salud', icon: 'Heart', color: 'red', order: 5 },
  { name: 'Seguros', icon: 'Shield', color: 'gray', order: 6 },
  { name: 'Entretenimiento', icon: 'Gamepad2', color: 'purple', order: 7 },
  { name: 'Ropa', icon: 'Shirt', color: 'pink', order: 8 },
  { name: 'Mascotas', icon: 'Heart', color: 'orange', order: 9 },
  { name: 'Ahorro', icon: 'PiggyBank', color: 'emerald', order: 10 },
  { name: 'Imprevistos', icon: 'AlertTriangle', color: 'amber', order: 11 },
];

// Formato chileno para números
export const formatCurrency = (amount: number, currency: Currency = 'CLP'): string => {
  const currencySymbols = {
    CLP: '$',
    USD: 'US$',
    EUR: '€'
  };

  // Formato chileno: puntos para miles, comas para decimales
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return `${currencySymbols[currency]} ${formatted}`;
};

// Helpers para localStorage (mientras se conecta Supabase)
export const STORAGE_KEYS = {
  EXPENSES: 'budget_expenses',
  BUDGETS: 'budget_budgets', 
  CATEGORIES: 'budget_categories',
  MEMBERS: 'budget_members',
  SETTINGS: 'budget_settings',
} as const;
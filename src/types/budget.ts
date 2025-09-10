// Tipos para el sistema de presupuestos familiares
// Adaptado para funcionar con localStorage mientras se conecta Supabase

export type Currency = 'CLP' | 'USD' | 'EUR';

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other';

export type FamilyMemberRole = 'admin' | 'adult' | 'kid';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  parentId?: string;
  order: number;
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

// Categorías iniciales del sistema con subcategorías
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Categorías principales
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

// Subcategorías comunes por categoría principal
export const DEFAULT_SUBCATEGORIES: Record<string, Omit<Category, 'id' | 'parentId'>[]> = {
  'Hogar': [
    { name: 'Arriendo', icon: 'Building', color: 'blue', order: 101 },
    { name: 'Servicios Básicos', icon: 'Zap', color: 'blue', order: 102 },
    { name: 'Internet y Telefonía', icon: 'Wifi', color: 'blue', order: 103 },
    { name: 'Mantención', icon: 'Wrench', color: 'blue', order: 104 },
    { name: 'Decoración', icon: 'Palette', color: 'blue', order: 105 },
  ],
  'Alimentación': [
    { name: 'Supermercado', icon: 'ShoppingCart', color: 'green', order: 201 },
    { name: 'Restaurantes', icon: 'Utensils', color: 'green', order: 202 },
    { name: 'Delivery', icon: 'Truck', color: 'green', order: 203 },
    { name: 'Panadería', icon: 'Coffee', color: 'green', order: 204 },
  ],
  'Transporte': [
    { name: 'Combustible', icon: 'Fuel', color: 'yellow', order: 301 },
    { name: 'Transporte Público', icon: 'Bus', color: 'yellow', order: 302 },
    { name: 'Taxi/Uber', icon: 'Car', color: 'yellow', order: 303 },
    { name: 'Mantención Vehículo', icon: 'Wrench', color: 'yellow', order: 304 },
    { name: 'Estacionamiento', icon: 'ParkingCircle', color: 'yellow', order: 305 },
  ],
  'Salud': [
    { name: 'Médico', icon: 'Stethoscope', color: 'red', order: 501 },
    { name: 'Medicamentos', icon: 'Pill', color: 'red', order: 502 },
    { name: 'Dental', icon: 'Smile', color: 'red', order: 503 },
    { name: 'Óptica', icon: 'Glasses', color: 'red', order: 504 },
  ],
};

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
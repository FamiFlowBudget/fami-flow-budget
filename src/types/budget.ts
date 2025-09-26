// src/types/budget.ts

export type Currency = 'USD' | 'CLP' | 'EUR';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other';
export type FamilyMemberRole = 'admin' | 'adult' | 'kid';

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
  receiptUrl?: string; // <<<--- CAMBIO IMPORTANTE AQUÍ
  createdAt: string;
  updatedAt: string;
}
// (El resto de las interfaces como Budget, etc., no cambian)
// ...
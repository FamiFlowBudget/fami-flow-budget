import { useMemo, useState } from 'react';
import { useBudgetSupabase } from './useBudgetSupabase';
import { formatCurrency } from '@/types/budget';

export interface Alert {
  id: string;
  type: 'overspending' | 'high_usage' | 'member_overspending';
  title: string;
  description: string;
  category?: string;
  member?: string;
  percentage?: number;
  amount?: number;
  timestamp: string;
}

interface AlertSettings {
  categoryAlerts: boolean;
  memberAlerts: boolean;
  budgetThreshold: number;
  overspendingThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export const useAlerts = () => {
  const { getCategoryProgress, members, currency } = useBudgetSupabase();
  const categoryProgress = getCategoryProgress();
  
  const [settings, setSettings] = useState<AlertSettings>({
    categoryAlerts: true,
    memberAlerts: true,
    budgetThreshold: 85,
    overspendingThreshold: 100,
    emailNotifications: true,
    pushNotifications: false
  });

  const activeAlerts = useMemo(() => {
    const alerts: Alert[] = [
      // Alertas de categorías
      ...categoryProgress
        .filter(cat => cat.percentage >= settings.budgetThreshold && settings.categoryAlerts)
        .map(cat => ({
          id: `cat-${cat.categoryId}`,
          type: cat.percentage >= settings.overspendingThreshold ? 'overspending' as const : 'high_usage' as const,
          title: cat.percentage >= settings.overspendingThreshold ? 
            `Sobrepasaste el presupuesto en ${cat.categoryName}` :
            `Cerca del límite en ${cat.categoryName}`,
          description: `Has gastado ${formatCurrency(cat.spentAmount, currency)} de ${formatCurrency(cat.budgetAmount, currency)} (${cat.percentage.toFixed(1)}%)`,
          category: cat.categoryName,
          percentage: cat.percentage,
          amount: cat.spentAmount,
          timestamp: new Date().toISOString()
        })),
      
      // Alertas de miembros (simuladas para demostración)
      ...(settings.memberAlerts ? members
        .filter((_, index) => index < 2) // Solo mostrar algunas alertas de ejemplo
        .map((member, index) => ({
          id: `member-${member.id}`,
          type: 'member_overspending' as const,
          title: `${member.name} ha gastado mucho este mes`,
          description: `Gastos elevados en comparación con meses anteriores`,
          member: member.name,
          percentage: 120 + index * 10,
          timestamp: new Date(Date.now() - index * 86400000).toISOString()
        })) : [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return alerts;
  }, [categoryProgress, members, currency, settings]);

  return {
    activeAlerts,
    settings,
    setSettings,
    alertCount: activeAlerts.length
  };
};
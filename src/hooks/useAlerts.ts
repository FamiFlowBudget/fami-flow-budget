// src/hooks/useAlerts.ts
import { useMemo, useState } from 'react'
import { useBudgetSupabase } from './useBudgetSupabase'
import { formatCurrency } from '@/types/budget'

export interface Alert {
  id: string
  type: 'overspending' | 'high_usage' | 'member_overspending'
  title: string
  description: string
  category?: string
  member?: string
  percentage?: number
  amount?: number
  timestamp: string
}

interface AlertSettings {
  categoryAlerts: boolean
  memberAlerts: boolean
  budgetThreshold: number
  overspendingThreshold: number
  emailNotifications: boolean
  pushNotifications: boolean
}

export const useAlerts = () => {
  // Obtenemos el objeto completo y luego leemos propiedades de forma segura
  const budget = useBudgetSupabase() as any

  const members = budget?.members ?? []
  const currency = budget?.currency ?? 'USD'

  // Si existe getCategoryProgress como función, la llamamos; si no, usamos categoryProgress si es arreglo
  const categoryProgress =
    typeof budget?.getCategoryProgress === 'function'
      ? budget.getCategoryProgress()
      : Array.isArray(budget?.categoryProgress)
      ? budget.categoryProgress
      : []

  const [settings, setSettings] = useState<AlertSettings>({
    categoryAlerts: true,
    memberAlerts: true,
    budgetThreshold: 85,
    overspendingThreshold: 100,
    emailNotifications: true,
    pushNotifications: false,
  })

  const activeAlerts = useMemo(() => {
    const alerts: Alert[] = [
      // Alertas de categorías
      ...(Array.isArray(categoryProgress)
        ? categoryProgress
            .filter(
              (cat: any) =>
                typeof cat?.percentage === 'number' &&
                cat.percentage >= settings.budgetThreshold &&
                settings.categoryAlerts
            )
            .map((cat: any) => ({
              id: `cat-${cat.categoryId}`,
              type:
                cat.percentage >= settings.overspendingThreshold
                  ? ('overspending' as const)
                  : ('high_usage' as const),
              title:
                cat.percentage >= settings.overspendingThreshold
                  ? `Sobrepasaste el presupuesto en ${cat.categoryName}`
                  : `Cerca del límite en ${cat.categoryName}`,
              description: `Has gastado ${formatCurrency(
                cat.spentAmount,
                currency
              )} de ${formatCurrency(cat.budgetAmount, currency)} (${
                typeof cat.percentage === 'number'
                  ? cat.percentage.toFixed(1)
                  : cat.percentage
              }%)`,
              category: cat.categoryName,
              percentage: cat.percentage,
              amount: cat.spentAmount,
              timestamp: new Date().toISOString(),
            }))
        : []),

      // Alertas de miembros (demo)
      ...(Array.isArray(members) && members.length
        ? members.slice(0, 2).map((member: any, index: number) => ({
            id: `member-${member.id}`,
            type: 'member_overspending' as const,
            title: `${member.name} ha gastado mucho este mes`,
            description: `Gastos elevados en comparación con meses anteriores`,
            member: member.name,
            percentage: 120 + index * 10,
            timestamp: new Date(Date.now() - index * 86400000).toISOString(),
          }))
        : []),
    ].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return alerts
  }, [categoryProgress, members, currency, settings])

  return {
    activeAlerts,
    settings,
    setSettings,
    alertCount: activeAlerts.length,
  }
}

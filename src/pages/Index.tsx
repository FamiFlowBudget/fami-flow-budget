// src/pages/Index.tsx

import { useMemo } from "react";
import { AddExpenseFAB } from "@/components/expenses/AddExpenseFAB";
import { KpiCards } from "@/components/dashboards/KpiCards";
import { YearTrend } from "@/components/dashboards/YearTrend";
import { MemberStacked } from "@/components/dashboards/MemberStacked";
import { DonutDistribution } from "@/components/dashboards/DonutDistribution";
import { CategoryProgress } from "@/components/dashboards/CategoryProgress";
import { DailyBurnSparkline } from "@/components/dashboards/DailyBurnSparkline";
import { AlertsList } from "@/components/dashboards/AlertsList";
import { DashboardFilters } from "@/components/filters/DashboardFilters";
import { usePeriod } from "@/providers/PeriodProvider";
import { useBudgetSupabase } from "@/hooks/useBudgetSupabase";

// Utilidad defensiva: si es función, la llama; si no, usa el valor/objeto tal cual;
// si viene undefined, devuelve un valor por defecto (fallback).
const callSafe = <T,>(maybeFn: any, fallback: T, ...args: any[]): T => {
  return typeof maybeFn === "function" ? maybeFn(...args) : (maybeFn ?? fallback);
};

const Index = () => {
  // Traemos el objeto entero para poder usarlo de forma defensiva
  const budget: any = useBudgetSupabase();
  const { period, setPeriod } = usePeriod();

  // Valores base con fallback
  const currency: string = budget?.currency ?? "USD";
  const loading: boolean = !!budget?.loading;

  // KPIs del período (función u objeto; con fallback seguro)
  const kpis = useMemo(
    () =>
      callSafe(
        budget?.getDashboardKPIs,
        { totalBudget: 0, totalSpent: 0, percentage: 0, income: 0, balance: 0 },
        period
      ),
    [budget?.getDashboardKPIs, period]
  );

  // Progreso de categorías (jerárquico) para el período
  const categoryProgress = useMemo(
    () => callSafe(budget?.getHierarchicalCategoryProgress, [] as any[], period),
    [budget?.getHierarchicalCategoryProgress, period]
  );

  // Tendencia anual
  const yearTrendData = useMemo(
    () => callSafe(budget?.getYearTrendData, [] as any[], period?.year),
    [budget?.getYearTrendData, period?.year]
  );

  // Daily burn del período
  const dailyBurnData = useMemo(
    () => callSafe(budget?.getDailyBurnData, [] as any[], period),
    [budget?.getDailyBurnData, period]
  );

  // Gastos del mes actual (según período)
  const currentMonthExpenses = useMemo(
    () => callSafe(budget?.getCurrentMonthExpenses, [] as any[], period),
    [budget?.getCurrentMonthExpenses, period]
  );

  // Colecciones base (con fallback seguro)
  const categories: any[] = Array.isArray(budget?.categories) ? budget.categories : [];
  const members: any[] = Array.isArray(budget?.members) ? budget.members : [];
  const expenses: any[] = Array.isArray(budget?.expenses) ? budget.expenses : [];

  // Distribución del mes (si no hay datos, pasamos [])
  const distributionData = useMemo(() => {
    // Si tienes la lógica original, colócala aquí.
    // Mientras tanto, devolvemos un arreglo vacío de forma segura.
    return [] as any[];
  }, [categories, currentMonthExpenses]);

  // Stacked por miembro (si no hay datos, pasamos [])
  const memberStackedData = useMemo(() => {
    // Si tienes la lógica original, colócala aquí.
    // Mientras tanto, devolvemos un arreglo vacío de forma segura.
    return [] as any[];
  }, [currentMonthExpenses, categories, members]);

  return (
    <div className="space-y-6">
      {/* Cabecera / acciones rápidas (si tenías algo aquí, puedes volver a añadirlo) */}

      {/* Dashboard principal con filtros */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resumen Financiero</h1>
        </div>

        <DashboardFilters />

        <KpiCards
          data={{ ...kpis, expenseCount: expenses.length }}
          isLoading={loading}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DonutDistribution
              data={distributionData}
              currency={currency}
              title="Distribución del Mes"
              isLoading={loading}
            />
          </div>

          <AlertsList
            categories={Array.isArray(categoryProgress) ? categoryProgress : []}
            currency={currency}
            isLoading={loading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryProgress
            categories={Array.isArray(categoryProgress) ? categoryProgress : []}
            isLoading={loading}
          />

          <DailyBurnSparkline
            data={Array.isArray(dailyBurnData) ? dailyBurnData : []}
            currency={currency}
            monthBudget={kpis?.totalBudget ?? 0}
            totalSpent={kpis?.totalSpent ?? 0}
            isLoading={loading}
          />
        </div>

        <MemberStacked
          data={Array.isArray(memberStackedData) ? memberStackedData : []}
          currency={currency}
          isLoading={loading}
        />

        <YearTrend
          data={Array.isArray(yearTrendData) ? yearTrendData : []}
          currency={currency}
          year={period?.year}
          onMonthClick={(month, year) => setPeriod({ month, year })}
          isLoading={loading}
        />
      </div>

      <AddExpenseFAB />
    </div>
  );
};

export default Index;

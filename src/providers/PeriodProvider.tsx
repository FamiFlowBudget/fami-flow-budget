import React, { createContext, useContext, useState, useEffect } from 'react';

interface PeriodContextType {
  period: {
    month: number;
    year: number;
  };
  setPeriod: (period: { month: number; year: number }) => void;
  getPeriodLabel: () => string;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    const now = new Date();
    return {
      period: { month: now.getMonth() + 1, year: now.getFullYear() },
      setPeriod: () => {}, // no-op function
      getPeriodLabel: () => new Date().toLocaleDateString('es-CL', { 
        month: 'short', 
        year: 'numeric' 
      })
    };
  }
  return context;
};

export const PeriodProvider = ({ children }: { children: React.ReactNode }) => {
  const [period, setPeriodState] = useState(() => {
    // Inicializar con el mes y año actual
    const now = new Date();
    const saved = localStorage.getItem('budget_current_period');
    
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { month: now.getMonth() + 1, year: now.getFullYear() };
      }
    }
    
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const setPeriod = (newPeriod: { month: number; year: number }) => {
    setPeriodState(newPeriod);
    localStorage.setItem('budget_current_period', JSON.stringify(newPeriod));
  };

  const getPeriodLabel = () => {
    const date = new Date(period.year, period.month - 1);
    return date.toLocaleDateString('es-CL', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <PeriodContext.Provider value={{ period, setPeriod, getPeriodLabel }}>
      {children}
    </PeriodContext.Provider>
  );
};
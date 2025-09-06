import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardFilters {
  members: string[];
  categories: string[];
  accounts: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

interface FiltersContextType {
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: DashboardFilters = {
  members: [],
  categories: [],
  accounts: [],
  dateRange: {}
};

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};

export const FiltersProvider = ({ children }: { children: React.ReactNode }) => {
  const [filters, setFiltersState] = useState<DashboardFilters>(() => {
    const saved = localStorage.getItem('dashboard_filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultFilters,
          ...parsed,
          dateRange: {
            ...defaultFilters.dateRange,
            ...parsed.dateRange,
            from: parsed.dateRange?.from ? new Date(parsed.dateRange.from) : undefined,
            to: parsed.dateRange?.to ? new Date(parsed.dateRange.to) : undefined,
          }
        };
      } catch {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  const setFilters = (newFilters: Partial<DashboardFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFiltersState(updated);
    localStorage.setItem('dashboard_filters', JSON.stringify(updated));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
    localStorage.removeItem('dashboard_filters');
  };

  const hasActiveFilters = 
    filters.members.length > 0 || 
    filters.categories.length > 0 || 
    filters.accounts.length > 0 ||
    Boolean(filters.dateRange.from) || 
    Boolean(filters.dateRange.to);

  return (
    <FiltersContext.Provider value={{ 
      filters, 
      setFilters, 
      clearFilters, 
      hasActiveFilters 
    }}>
      {children}
    </FiltersContext.Provider>
  );
};
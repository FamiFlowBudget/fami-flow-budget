import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Receipt, Store, Tag, ArrowUpDown } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { formatCurrency } from '@/types/budget';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { expenses, categories } = useBudgetSupabase();
  const navigate = useNavigate();

  // Search results
  const results = query.trim() ? [
    // Search expenses by description
    ...expenses
      .filter(expense => 
        expense.description.toLowerCase().includes(query.toLowerCase()) ||
        (expense.merchant && expense.merchant.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 5)
      .map(expense => ({
        type: 'expense' as const,
        id: expense.id,
        title: expense.description,
        subtitle: expense.merchant || 'Sin comercio',
        amount: formatCurrency(expense.amount),
        icon: Receipt,
        action: () => navigate('/expenses')
      })),
    
    // Search categories
    ...categories
      .filter(category => 
        category.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3)
      .map(category => ({
        type: 'category' as const,
        id: category.id,
        title: category.name,
        subtitle: 'Categoría',
        icon: Tag,
        action: () => navigate('/categories')
      })),
    
    // Search merchants
    ...Array.from(new Set(
      expenses
        .filter(expense => 
          expense.merchant && 
          expense.merchant.toLowerCase().includes(query.toLowerCase())
        )
        .map(expense => expense.merchant!)
    ))
      .slice(0, 3)
      .map(merchant => ({
        type: 'merchant' as const,
        id: merchant,
        title: merchant,
        subtitle: 'Comercio',
        icon: Store,
        action: () => navigate('/expenses')
      }))
  ] : [];

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? results.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onOpenChange(false);
          setQuery('');
        }
        break;
      case 'Escape':
        onOpenChange(false);
        setQuery('');
        break;
    }
  }, [open, results, selectedIndex, onOpenChange, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onOpenChange]);

  const handleResultClick = (result: typeof results[0]) => {
    result.action();
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar gasto, comercio o categoría..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto border-t">
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                  {'amount' in result && result.amount && (
                    <span className="text-sm font-medium">
                      {result.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground border-t">
            <p>No se encontraron resultados</p>
            <p className="text-xs mt-1">Intenta con otros términos</p>
          </div>
        )}

        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Navegar
              </span>
              <span>Enter para seleccionar</span>
            </div>
            <span>Esc para cerrar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
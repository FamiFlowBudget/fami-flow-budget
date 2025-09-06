import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Expense, formatCurrency } from '@/types/budget';
import { Clock, Receipt } from 'lucide-react';

interface RecentExpensesProps {
  expenses: Expense[];
}

export const RecentExpenses = ({ expenses }: RecentExpensesProps) => {
  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, string> = {
      cash: 'default',
      debit: 'secondary', 
      credit: 'destructive',
      transfer: 'outline',
      other: 'secondary',
    };
    
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      debit: 'Débito',
      credit: 'Crédito', 
      transfer: 'Transferencia',
      other: 'Otro',
    };

    return (
      <Badge variant={variants[method] as any} className="text-xs">
        {labels[method]}
      </Badge>
    );
  };

  if (expenses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">
          <Receipt className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <h3 className="font-semibold mb-2">No hay gastos registrados</h3>
          <p className="text-sm">Usa el botón + para agregar tu primer gasto</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Gastos Recientes</h3>
      </div>
      
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div 
            key={expense.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-medium text-sm truncate">{expense.description}</p>
                {getPaymentMethodBadge(expense.paymentMethod)}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {expense.merchant && (
                  <>
                    <span className="truncate">{expense.merchant}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {new Date(expense.date).toLocaleDateString('es-CL', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="text-right ml-3">
              <p className="font-bold text-expense">
                -{formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {expenses.length >= 5 && (
        <div className="text-center mt-4">
          <button className="text-sm text-primary hover:underline">
            Ver todos los gastos
          </button>
        </div>
      )}
    </Card>
  );
};
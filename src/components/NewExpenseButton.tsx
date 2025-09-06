import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';

interface NewExpenseButtonProps {
  variant?: 'default' | 'floating';
  className?: string;
}

export const NewExpenseButton = ({ variant = 'default', className }: NewExpenseButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for keyboard shortcut
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={className}
        size={variant === 'floating' ? 'lg' : 'sm'}
        aria-label="Añadir nuevo gasto (Shift + N)"
        title="Añadir nuevo gasto (Shift + N)"
      >
        <Plus className="w-4 h-4 mr-2" />
        Gasto
      </Button>

      <ExpenseFormDialog 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
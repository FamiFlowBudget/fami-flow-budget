import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseFormDialog } from './ExpenseFormDialog';

export const AddExpenseFAB = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fab"
        size="lg"
        aria-label="Agregar gasto"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialog */}
      <ExpenseFormDialog 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
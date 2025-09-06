import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AddExpenseFAB } from '@/components/expenses/AddExpenseFAB';
import { DemoDataGenerator } from '@/components/demo/DemoDataGenerator';

const Index = () => {
  return (
    <AppLayout>
      <DemoDataGenerator />
      <Dashboard />
      <AddExpenseFAB />
    </AppLayout>
  );
};

export default Index;

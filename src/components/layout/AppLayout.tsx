import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Main content */}
      <main className="pb-20 lg:pb-6">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Navegación móvil existente se mantiene desde el header */}
    </div>
  );
};
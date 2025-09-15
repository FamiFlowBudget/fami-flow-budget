import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { RoleProtection } from '@/components/auth/RoleProtection';

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
      
      {/* Ocultar elementos de desarrollo para usuarios no admin */}
      <RoleProtection allowedRoles={['admin']}>
        <style>
          {`
            /* Ocultar el botón "Edit in Lovable" para usuarios no admin */
            [data-lovable-edit-button] {
              display: none !important;
            }
            /* Ocultar cualquier overlay o interfaz de chat de IA */
            [id*="lovable"], [class*="lovable-chat"], [class*="ai-chat"] {
              display: none !important;
            }
          `}
        </style>
      </RoleProtection>
    </div>
  );
};
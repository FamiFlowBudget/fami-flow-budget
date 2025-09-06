import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">$</span>
              </div>
              <span className="font-bold text-xl">Presupuesto Familiar</span>
            </div>
          </div>
          
          {/* Usuario actual - placeholder */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">U</span>
            </div>
            <span className="hidden sm:inline text-sm font-medium">Usuario Demo</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Navegación móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center space-y-1 text-primary">
            <div className="h-5 w-5 rounded bg-current opacity-80" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary">
            <div className="h-5 w-5 rounded bg-current opacity-60" />
            <span className="text-xs">Gastos</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary">
            <div className="h-5 w-5 rounded bg-current opacity-60" />
            <span className="text-xs">Presupuesto</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary">
            <div className="h-5 w-5 rounded bg-current opacity-60" />
            <span className="text-xs">Reportes</span>
          </button>
        </div>
      </nav>

      {/* Espaciado para navegación móvil */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};
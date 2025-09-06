import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, DollarSign, Home, PieChart, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Finanzas Familiares</span>
            </div>
          </div>
          
          {/* Usuario actual */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Navegación móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
        <div className="grid grid-cols-3 h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center space-y-1 ${
              isActive('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link 
            to="/budget" 
            className={`flex flex-col items-center justify-center space-y-1 ${
              isActive('/budget') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <PieChart className="h-5 w-5" />
            <span className="text-xs">Presupuesto</span>
          </Link>
          <Link 
            to="/categories" 
            className={`flex flex-col items-center justify-center space-y-1 ${
              isActive('/categories') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Tag className="h-5 w-5" />
            <span className="text-xs">Categorías</span>
          </Link>
        </div>
      </nav>

      {/* Espaciado para navegación móvil */}
      <div className="h-16 lg:hidden" />
    </div>
  );
};
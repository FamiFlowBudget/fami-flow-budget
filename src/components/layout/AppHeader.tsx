import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { AppDrawer } from './AppDrawer';
import { PeriodSelector } from '../PeriodSelector';
import { ThemeToggle } from '../ThemeToggle';
import { UserMenu } from '../UserMenu';
import { NewExpenseButton } from '../NewExpenseButton';
import { getVisibleNavItems } from '@/lib/nav';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { useAuth } from '@/hooks/useAuth';
import { usePeriod } from '@/providers/PeriodProvider';
import { useAlerts } from '@/hooks/useAlerts';
export const AppHeader = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const {
    user
  } = useAuth();
  const {
    currentMember,
    getDashboardKPIs
  } = useBudgetSupabase();
  const {
    getPeriodLabel
  } = usePeriod();
  const {
    alertCount
  } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = getVisibleNavItems(currentMember?.role || null);
  const kpis = getDashboardKPIs();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };
  const getBudgetUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };
  if (!user) {
    // Header para usuarios no autenticados
    return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{
      paddingTop: 'env(safe-area-inset-top)'
    }}>
        <div className="container flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/lovable-uploads/16ccfe61-dec4-488a-b110-2589cd2ec3fa.png" alt="FamiFlow Logo" className="h-8 w-auto" />
              <span className="text-xs text-muted-foreground">Budget Tracker</span>
            </Link>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Crear familia</Link>
            </Button>
          </div>
        </div>
      </header>;
  }
  return <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" style={{
      paddingTop: 'env(safe-area-inset-top)'
    }} role="banner">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4">
          {/* Left: Brand + Mobile Menu */}
          <div className="flex items-center space-x-3 min-w-0">
            <AppDrawer />
            
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity min-w-0" aria-label="Ir al inicio">
              <img src="/lovable-uploads/16ccfe61-dec4-488a-b110-2589cd2ec3fa.png" alt="FamiFlow Logo" className="h-16 w-16 object-contain flex-shrink-0" />
              <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">Budget Tracker</span>
            </Link>
          </div>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Navegación principal">
            {navItems.map(item => {
            const Icon = item.icon;
            return <Link key={item.href} to={item.href} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} aria-current={isActive(item.href) ? 'page' : undefined}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {/* Budget usage indicator for Presupuestos */}
                  {item.href === '/budget' && kpis.totalBudget > 0 && <Badge variant={getBudgetUsageColor(kpis.percentage)} className="ml-1 text-xs py-0.5 mx-[3px] px-[4px]">
                      {Math.round(kpis.percentage)}%
                    </Badge>}
                </Link>;
          })}
          </nav>

          {/* Right: Search + Actions */}
          <div className="flex items-center space-x-2">
            {/* Global Search (Desktop) */}
            {/* Search removed per user request */}

            {/* Mobile Search */}
            {/* Search removed per user request */}

            {/* Period Selector */}
            <div className="hidden sm:block">
              <PeriodSelector />
            </div>

            {/* Add Expense */}
            <NewExpenseButton />

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative" onClick={() => navigate('/alerts')}>
              <Bell className="w-4 h-4" />
              {alertCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {alertCount}
                </Badge>}
            </Button>

            {/* Connection Status */}
            <div className="hidden lg:flex items-center" title={isOnline ? "En línea" : "Sin conexión"}>
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            </div>

            {/* Theme Toggle (Desktop) */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Period Selector */}
        <div className="sm:hidden border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Período actual:</span>
            <PeriodSelector />
          </div>
        </div>
      </header>
    </>;
};
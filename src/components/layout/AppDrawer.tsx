import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getVisibleNavItems } from '@/lib/nav';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { ThemeToggle } from '../ThemeToggle';
import { UserMenu } from '../UserMenu';
import { NewExpenseButton } from '../NewExpenseButton';

export const AppDrawer = () => {
  const [open, setOpen] = useState(false);
  const { currentMember } = useBudgetSupabase();
  const location = useLocation();
  
  console.log('Current member role:', currentMember?.role);
  console.log('Current member object:', currentMember);
  const navItems = getVisibleNavItems(currentMember?.role || null);
  console.log('Nav items returned:', navItems);
  
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-9 w-9 p-0 lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              Family Budget Tracker
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="px-6 pb-4">
          <NewExpenseButton className="w-full" />
        </div>

        <Separator />

        <nav className="px-6 py-4" role="navigation" aria-label="Navegación principal">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <Separator />

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tema</span>
            <ThemeToggle />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cuenta</span>
            <UserMenu />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
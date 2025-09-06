import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { currentMember } = useBudgetSupabase();
  const [open, setOpen] = useState(false);

  if (!user || !currentMember) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      adult: 'Adulto',
      kid: 'Niño'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentMember.photoUrl} alt={currentMember.name} />
            <AvatarFallback className="text-xs">
              {getInitials(currentMember.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {currentMember.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleBadge(currentMember.role)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Configurar pagos</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notificaciones</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferencias</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
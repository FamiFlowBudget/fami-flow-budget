import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, Users, Plus, UserPlus } from 'lucide-react';
import { useFamilyContext } from '@/contexts/FamilyContext';
import { CreateFamilyForm } from './CreateFamilyForm';
import { JoinFamilyForm } from './JoinFamilyForm';

export const FamilySwitcher: React.FC = () => {
  const { currentFamily, userFamilies, switchFamily, loading } = useFamilyContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  if (loading || !currentFamily) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Users className="h-4 w-4 mr-2" />
        Cargando...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline-block">{currentFamily.name}</span>
            <Badge variant="outline" className="text-xs">
              {currentFamily.familyPublicId}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Familia Actual</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {userFamilies.map((userFamily) => {
            const family = userFamily.family;
            const isActive = family?.id === currentFamily.id;
            
            return (
              <DropdownMenuItem
                key={userFamily.id}
                onClick={() => family && switchFamily(family.id)}
                className={isActive ? 'bg-accent' : ''}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{family?.name}</span>
                    {isActive && <Badge variant="default" className="text-xs">Actual</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{family?.familyPublicId}</Badge>
                    <span>Rol: {userFamily.role === 'admin' ? 'Admin' : userFamily.role === 'editor' ? 'Editor' : 'Visitante'}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Nueva Familia
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowJoinDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Unirse a Familia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Familia</DialogTitle>
          </DialogHeader>
          <CreateFamilyForm onSuccess={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unirse a una Familia</DialogTitle>
          </DialogHeader>
          <JoinFamilyForm onSuccess={() => setShowJoinDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
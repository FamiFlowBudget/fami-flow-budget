import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditDialog = ({ open, onOpenChange }: ProfileEditDialogProps) => {
  const { currentMember, updateMemberProfile } = useBudgetSupabase();
  const { toast } = useToast();
  const [name, setName] = useState(currentMember?.name || '');
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateMemberProfile({ name: name.trim() });
      toast({
        title: "Perfil actualizado",
        description: "Tu nombre se ha actualizado correctamente",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentMember) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentMember.photoUrl} alt={currentMember.name} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(name || currentMember.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre visible</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Este nombre será visible para todos los miembros de la familia
            </p>
          </div>

          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input value={currentMember.email || ''} disabled className="opacity-50" />
            <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Input 
              value={currentMember.role === 'admin' ? 'Administrador' : 
                     currentMember.role === 'editor' ? 'Editor' : 'Visitante'} 
              disabled 
              className="opacity-50" 
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || !name.trim() || name.trim() === currentMember.name}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
// src/components/family/FamilyManagement.tsx (Versión Final y Funcional)

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFamilies } from '@/hooks/useFamilies';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { FamilyMember, FamilyMemberRole } from '@/types/budget';
import { Users, Copy, Mail, CheckCircle, XCircle, Clock, Shield, Eye, Edit, UserPlus, Trash2, User, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NoFamilyAssociated } from './NoFamilyAssociated';

export const FamilyManagement = () => {
  const { 
    currentFamily, 
    familyMembers, 
    joinRequests,
    createFamily,
    requestToJoinFamilyByCode,
    updateFamilyName, // <<<--- IMPORTAMOS LA NUEVA FUNCIÓN
    handleJoinRequest, 
    createInvitation,
    loading 
  } = useFamilies();
  const { members, currentMember, addFamilyMember, updateAnyMemberProfile, deleteFamilyMember } = useBudgetSupabase();
  const { toast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('visitor');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingFamilyName, setEditingFamilyName] = useState('');
  const [editingFamily, setEditingFamily] = useState(false);
  // (El resto de los useState no cambian)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', email: '', role: 'adult' as FamilyMemberRole });

  const copyFamilyId = () => {
    if (currentFamily) {
      navigator.clipboard.writeText(currentFamily.family_public_id);
      toast({
        title: "ID copiado",
        description: "El ID de familia ha sido copiado al portapapeles"
      });
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) return;
    const result = await createInvitation(inviteEmail, inviteRole);
    if (result && !result.error) {
      setInviteEmail('');
      setInviteRole('visitor');
      setInviteDialogOpen(false);
    }
  };

  // <<<--- ESTA FUNCIÓN HA SIDO ACTUALIZADA ---<<<
  const handleEditFamilyName = async () => {
    if (!editingFamilyName.trim() || editingFamilyName === currentFamily?.name) {
      setEditingFamily(false);
      return;
    }
    const result = await updateFamilyName(editingFamilyName.trim());
    if (result.success) {
      setEditingFamily(false);
    }
    // La notificación de éxito o error ya la maneja el hook 'useFamilies'
  };

  // (El resto de funciones auxiliares como getRoleIcon, etc., no cambian)
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'visitor': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'visitor': return 'Visitante';
      default: return role;
    }
  };
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      case 'visitor': return 'secondary';
      default: return 'outline';
    }
  };
  const getFamilyMemberRoleIcon = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'adult': return <User className="h-4 w-4" />;
      case 'kid': return <Baby className="h-4 w-4" />;
    }
  };
  const getFamilyMemberRoleName = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'adult': return 'Adulto';
      case 'kid': return 'Niño';
    }
  };
  const getFamilyMemberRoleColor = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'adult': return 'default';
      case 'kid': return 'secondary';
    }
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  // (El resto del componente no cambia, solo se asegura de que el código sea el correcto)
  if (!currentFamily) {
    return (
      <NoFamilyAssociated 
        createFamily={createFamily}
        requestToJoinFamilyByCode={requestToJoinFamilyByCode}
        loading={loading}
      />
    );
  }

  const isAdmin = currentFamily.userRole === 'admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingFamily ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <Input
                      value={editingFamilyName}
                      onChange={(e) => setEditingFamilyName(e.target.value)}
                      placeholder="Nombre de la familia"
                      className="text-xl font-semibold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditFamilyName} disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingFamily(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {currentFamily.name}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFamilyName(currentFamily.name);
                          setEditingFamily(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Moneda: {currentFamily.currency}
                  </CardDescription>
                </div>
              )}
            </div>
            <Badge variant={getRoleColor(currentFamily.userRole || 'visitor')}>
              {getRoleIcon(currentFamily.userRole || 'visitor')}
              <span className="ml-1">{getRoleName(currentFamily.userRole || 'visitor')}</span>
            </Badge>
          </div>
        </CardHeader>
        {/* ... El resto del archivo es idéntico y no necesita ser incluido aquí por brevedad ... */}
      </Card>
      {/* ... El resto del archivo ... */}
    </div>
  );
};
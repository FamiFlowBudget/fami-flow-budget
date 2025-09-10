import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { FamilyMember, FamilyMemberRole } from '@/types/budget';
import { UserPlus, Mail, Trash2, Edit, Shield, User, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Members = () => {
  const { members, currentMember, addFamilyMember, updateAnyMemberProfile, deleteFamilyMember } = useBudgetSupabase();
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', email: '', role: 'editor' as FamilyMemberRole });
  const [inviteEmail, setInviteEmail] = useState('');

  const isAdmin = currentMember?.role === 'admin';
  const canEdit = (member: FamilyMember) => isAdmin || member.id === currentMember?.id;
  const canDelete = (member: FamilyMember) => isAdmin && member.id !== currentMember?.id;

  const getRoleIcon = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'editor': return <User className="h-4 w-4" />;
      case 'visitor': return <Baby className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'visitor': return 'Visitante';
    }
  };

  const getRoleColor = (role: FamilyMemberRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      case 'visitor': return 'secondary';
    }
  };

  const handleAddMember = async () => {
    if (!newMemberData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre es obligatorio"
      });
      return;
    }

    const success = await addFamilyMember({
      name: newMemberData.name,
      email: newMemberData.email || undefined,
      role: newMemberData.role,
      active: true,
      status: 'active'
    });

    if (success) {
      toast({
        title: "Miembro agregado",
        description: "El miembro ha sido agregado exitosamente"
      });
      setShowAddDialog(false);
      setNewMemberData({ name: '', email: '', role: 'editor' });
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    try {
      await updateAnyMemberProfile(editingMember.id, {
        name: editingMember.name,
        email: editingMember.email || undefined
      });

      toast({
        title: "Perfil actualizado",
        description: "La información del miembro ha sido actualizada"
      });
      setEditingMember(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil"
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const success = await deleteFamilyMember(memberId);
    
    if (success) {
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado de la familia"
      });
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El email es obligatorio"
      });
      return;
    }

    // TODO: Implement email invitation functionality
    toast({
      title: "Invitación enviada",
      description: `Se ha enviado una invitación a ${inviteEmail}`
    });
    setShowInviteDialog(false);
    setInviteEmail('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Miembros de la Familia</h1>
          <p className="text-muted-foreground">Gestiona los miembros y sus permisos</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Invitar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar nuevo miembro</DialogTitle>
                  <DialogDescription>
                    Envía una invitación por correo electrónico para unirse a la familia
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inviteEmail">Email</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleInviteMember}>
                    Enviar Invitación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Miembro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar nuevo miembro</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo miembro a la familia manualmente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={newMemberData.role}
                      onValueChange={(value) => setNewMemberData(prev => ({ ...prev, role: value as FamilyMemberRole }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="visitor">Visitante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMember}>
                    Agregar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className={member.id === currentMember?.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.photoUrl} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {member.name}
                      {member.id === currentMember?.id && (
                        <Badge variant="outline">Tú</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleColor(member.role)} className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    {getRoleName(member.role)}
                  </Badge>
                  
                  <div className="flex gap-1">
                    {canEdit(member) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingMember({ ...member })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar miembro</DialogTitle>
                            <DialogDescription>
                              Actualiza la información del miembro
                            </DialogDescription>
                          </DialogHeader>
                          {editingMember && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="editName">Nombre</Label>
                                <Input
                                  id="editName"
                                  value={editingMember.name}
                                  onChange={(e) => setEditingMember(prev => 
                                    prev ? { ...prev, name: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label htmlFor="editEmail">Email</Label>
                                <Input
                                  id="editEmail"
                                  type="email"
                                  value={editingMember.email || ''}
                                  onChange={(e) => setEditingMember(prev => 
                                    prev ? { ...prev, email: e.target.value } : null
                                  )}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMember(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdateMember}>
                              Guardar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {canDelete(member) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El miembro {member.name} será eliminado 
                              permanentemente de la familia.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Members;
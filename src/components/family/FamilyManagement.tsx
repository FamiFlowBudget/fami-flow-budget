import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFamilies } from '@/hooks/useFamilies';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { FamilyMember, FamilyMemberRole } from '@/types/budget';
import { Users, Copy, Mail, CheckCircle, XCircle, Clock, Shield, Eye, Edit, UserPlus, Settings, Trash2, User, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FamilyManagement = () => {
  const { 
    currentFamily, 
    familyMembers, 
    joinRequests, 
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'visitor':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      case 'visitor':
        return 'Visitante';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'editor':
        return 'default';
      case 'visitor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Family member role functions
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

  const isCurrentUserAdmin = currentMember?.role === 'admin';
  const canEditMember = (member: FamilyMember) => isCurrentUserAdmin || member.id === currentMember?.id;
  const canDeleteMember = (member: FamilyMember) => isCurrentUserAdmin && member.id !== currentMember?.id;

  const handleEditFamilyName = async () => {
    // TODO: Implement family name update
    toast({
      title: "Nombre actualizado",
      description: "El nombre de la familia ha sido actualizado"
    });
    setEditingFamily(false);
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
      active: true
    });

    if (success) {
      toast({
        title: "Miembro agregado",
        description: "El miembro ha sido agregado exitosamente"
      });
      setShowAddMemberDialog(false);
      setNewMemberData({ name: '', email: '', role: 'adult' });
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

  if (!currentFamily) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No hay familia seleccionada</h3>
        <p className="text-muted-foreground">Selecciona o crea una familia para comenzar.</p>
      </div>
    );
  }

  const isAdmin = currentFamily.userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Información de la familia */}
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
                    <Button size="sm" onClick={handleEditFamilyName}>
                      Guardar
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
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="font-medium">ID de Familia:</Label>
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
              {currentFamily.family_public_id}
            </code>
            <Button variant="outline" size="sm" onClick={copyFamilyId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Invitar por Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                    <DialogDescription>
                      Envía una invitación para que alguien se una a tu familia.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Rol</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visitor">Visitante</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSendInvitation} disabled={!inviteEmail || loading}>
                        {loading ? 'Enviando...' : 'Enviar Invitación'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
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
                      <Label htmlFor="role">Tipo</Label>
                      <Select
                        value={newMemberData.role}
                        onValueChange={(value) => setNewMemberData(prev => ({ ...prev, role: value as FamilyMemberRole }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adult">Adulto</SelectItem>
                          <SelectItem value="kid">Niño</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
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
        </CardContent>
      </Card>

      {/* Miembros de la familia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Miembros de la Familia ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
                      <Badge variant={getFamilyMemberRoleColor(member.role)} className="flex items-center gap-1">
                        {getFamilyMemberRoleIcon(member.role)}
                        {getFamilyMemberRoleName(member.role)}
                      </Badge>
                      
                      <div className="flex gap-1">
                        {canEditMember(member) && (
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
                        
                        {canDeleteMember(member) && (
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

          {/* Miembros del sistema de familias */}
          {familyMembers.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Sistema de Familias</h4>
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded border-l-2 border-l-primary/20 bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{getRoleName(member.role)}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes pendientes (solo para admins) */}
      {isAdmin && joinRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Solicitudes Pendientes ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {joinRequests.map((request) => (
                <div key={request.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitud enviada el {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  </div>
                  
                  {request.message && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <strong>Mensaje:</strong> {request.message}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Aprobar solicitud</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres aprobar la solicitud de {request.email}? 
                            Se unirá como visitante por defecto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleJoinRequest(request.id, 'approved', 'visitor')}
                          >
                            Aprobar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rechazar solicitud</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres rechazar la solicitud de {request.email}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleJoinRequest(request.id, 'rejected')}
                          >
                            Rechazar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
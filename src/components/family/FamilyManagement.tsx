import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useFamilies } from '@/hooks/useFamilies';
import { Users, Copy, Mail, CheckCircle, XCircle, Clock, Shield, Eye, Edit, UserPlus, Settings } from 'lucide-react';
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
  const { toast } = useToast();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

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
      setInviteRole('viewer');
      setInviteDialogOpen(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
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
      case 'viewer':
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
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {currentFamily.name}
              </CardTitle>
              <CardDescription>
                Moneda: {currentFamily.currency}
              </CardDescription>
            </div>
            <Badge variant={getRoleColor(currentFamily.userRole || 'viewer')}>
              {getRoleIcon(currentFamily.userRole || 'viewer')}
              <span className="ml-1">{getRoleName(currentFamily.userRole || 'viewer')}</span>
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
                    Invitar Miembro
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
                          <SelectItem value="viewer">Visitante</SelectItem>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Miembros de la familia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Miembros de la Familia ({familyMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge variant={getRoleColor(member.role)}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1">{getRoleName(member.role)}</span>
                </Badge>
              </div>
            ))}
          </div>
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
                            onClick={() => handleJoinRequest(request.id, 'approved', 'viewer')}
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
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth';
import { Users, Mail, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Invite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptInvitation, loading } = useFamilies();
  const [inviteStatus, setInviteStatus] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const token = searchParams.get('token');
  const inviteEmail = searchParams.get('email');

  useEffect(() => {
    if (!token || !inviteEmail) {
      setInviteStatus('error');
      setErrorMessage('Enlace de invitación inválido');
      return;
    }

    if (!user) {
      // Usuario no autenticado, mostrar mensaje para iniciar sesión
      setInviteStatus('ready');
      return;
    }

    // Verificar que el email del usuario coincida con el de la invitación
    if (user.email !== decodeURIComponent(inviteEmail)) {
      setInviteStatus('error');
      setErrorMessage(`Esta invitación está destinada a ${decodeURIComponent(inviteEmail)}. Por favor, inicia sesión con esa cuenta o contacta al administrador.`);
      return;
    }

    setInviteStatus('ready');
  }, [token, inviteEmail, user]);

  const handleAcceptInvitation = async () => {
    if (!token || !user?.email) return;

    setInviteStatus('processing');
    
    const result = await acceptInvitation(token, user.email);
    
    if (result.success) {
      setInviteStatus('success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else {
      setInviteStatus('error');
      setErrorMessage(result.error || 'Error al procesar la invitación');
    }
  };

  const handleSignIn = () => {
    // Guardar los parámetros de invitación en sessionStorage para después del login
    if (token && inviteEmail) {
      sessionStorage.setItem('pendingInvitation', JSON.stringify({ token, email: inviteEmail }));
    }
    navigate('/auth');
  };

  if (inviteStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Validando invitación...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (inviteStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <CardTitle className="text-green-600">¡Invitación aceptada!</CardTitle>
            <CardDescription>
              Te has unido exitosamente a la familia. Serás redirigido al dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (inviteStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-red-600">Error en la invitación</CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Invitación a FamiFlow</CardTitle>
            <CardDescription>
              Has sido invitado a unirte a una familia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Para aceptar esta invitación, necesitas iniciar sesión con la cuenta: {decodeURIComponent(inviteEmail || '')}
              </AlertDescription>
            </Alert>
            <Button onClick={handleSignIn} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Invitación a FamiFlow</CardTitle>
          <CardDescription>
            Has sido invitado a unirte a una familia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Invitación para: {user.email}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Invitación verificada y segura</span>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Al aceptar esta invitación, te unirás a una familia y tendrás acceso a su información financiera según tu rol asignado.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={loading || inviteStatus === 'processing'}
              className="flex-1"
            >
              {inviteStatus === 'processing' ? 'Procesando...' : 'Aceptar Invitación'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
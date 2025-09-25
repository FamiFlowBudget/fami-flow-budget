import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface Family {
  id: string;
  name: string;
  family_public_id: string;
  currency: string;
  timezone: string;
  created_at: string;
  userRole?: 'admin' | 'editor' | 'visitor';
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: 'admin' | 'editor' | 'visitor';
  photo_url?: string;
  active: boolean;
  family_id?: string;
}

export interface JoinRequest {
  id: string;
  email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  family_id: string;
  requester_user_id?: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  email_allowlist: string;
  token: string;
  family_id: string;
  suggested_role: string;
  expires_at: string;
  uses_remaining: number;
  created_at: string;
}

export const useFamilies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar familias del usuario
  const loadUserFamilies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Obtener familias donde el usuario es miembro
      const { data: userFamiliesData, error: userFamiliesError } = await supabase
        .from('user_families')
        .select(`
          family_id,
          role,
          families (
            id,
            name,
            family_public_id,
            currency,
            timezone,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (userFamiliesError) throw userFamiliesError;

      const familiesWithRole = (userFamiliesData || []).map(uf => ({
        id: uf.families.id,
        name: uf.families.name,
        family_public_id: uf.families.family_public_id,
        currency: uf.families.currency,
        timezone: uf.families.timezone,
        created_at: uf.families.created_at,
        userRole: uf.role as 'admin' | 'editor' | 'visitor'
      }));

      setFamilies(familiesWithRole);
      
      // Si hay familias, seleccionar la primera como actual
      if (familiesWithRole.length > 0 && !currentFamily) {
        setCurrentFamily(familiesWithRole[0]);
      }
    } catch (error) {
      console.error('Error loading families:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las familias"
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva familia
  const createFamily = async (name: string, currency: string = 'CLP') => {
    if (!user) return { error: 'Usuario no autenticado' };

    try {
      setLoading(true);

      // Crear familia
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          currency,
          timezone: 'America/Santiago',
          family_public_id: '' // Se generará automáticamente por el trigger
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // Agregar usuario como administrador
      const { error: memberError } = await supabase
        .from('user_families')
        .insert({
          user_id: user.id,
          family_id: familyData.id,
          role: 'admin',
          status: 'active'
        });

      if (memberError) throw memberError;

      // Crear perfil de miembro de familia
      const { error: profileError } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          family_id: familyData.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          role: 'admin',
          active: true
        });

      if (profileError) throw profileError;

      toast({
        title: "¡Familia creada!",
        description: `Tu familia "${name}" ha sido creada exitosamente. ID: ${familyData.family_public_id}`
      });

      // Recargar familias
      await loadUserFamilies();
      return { data: familyData };
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la familia"
      });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // >>>>> NUEVA FUNCIÓN AÑADIDA AQUÍ <<<<<
  // Solicitar unirse a una familia con un código
  const requestToJoinFamilyByCode = async (familyCode: string) => {
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para poder unirte a una familia.",
        variant: "destructive"
      });
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      // 1. Buscar la familia por su código público
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('family_public_id', familyCode.toUpperCase())
        .single();

      if (familyError || !familyData) {
        throw new Error('El código de familia no es válido o no existe.');
      }

      // 2. Verificar que el usuario no sea ya miembro de esa familia
      const { data: existingMember } = await supabase
        .from('user_families')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('family_id', familyData.id)
        .single();

      if (existingMember) {
        throw new Error('Ya eres miembro de esta familia.');
      }
      
      // 3. Verificar si ya existe una solicitud pendiente
      const { data: existingRequest } = await supabase
        .from('join_requests')
        .select('id')
        .eq('requester_user_id', user.id)
        .eq('family_id', familyData.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        throw new Error('Ya tienes una solicitud pendiente para esta familia.');
      }

      // 4. Crear la solicitud de unión
      const { error: requestError } = await supabase
        .from('join_requests')
        .insert({
          family_id: familyData.id,
          requester_user_id: user.id,
          email: user.email!,
          status: 'pending',
        });

      if (requestError) {
        throw requestError;
      }

      toast({
        title: "¡Solicitud Enviada!",
        description: `Tu solicitud para unirte a la familia "${familyData.name}" ha sido enviada. Los administradores han sido notificados.`,
      });
      return { success: true };

    } catch (error: any) {
      toast({
        title: "Error al enviar la solicitud",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Solicitar unirse a familia
  const requestToJoinFamily = async (familyPublicId: string, message?: string) => {
    console.log('🔍 Iniciando solicitud de unión a familia:', { familyPublicId, user: user?.id });
    
    if (!user) {
      console.log('❌ Usuario no autenticado');
      return { error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);
      console.log('🔄 Cargando...');

      // Verificar que la familia existe
      console.log('🔍 Buscando familia con ID:', familyPublicId.toUpperCase());
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('family_public_id', familyPublicId.toUpperCase())
        .single();

      if (familyError || !familyData) {
        console.log('❌ Error buscando familia:', familyError);
        throw new Error('ID de familia no encontrado');
      }

      console.log('✅ Familia encontrada:', familyData);

      // Verificar que el usuario no es ya miembro
      console.log('🔍 Verificando si el usuario ya es miembro...');
      const { data: existingMember } = await supabase
        .from('user_families')
        .select('id')
        .eq('user_id', user.id)
        .eq('family_id', familyData.id)
        .single();

      if (existingMember) {
        console.log('❌ Usuario ya es miembro de la familia');
        throw new Error('Ya eres miembro de esta familia');
      }

      console.log('✅ Usuario no es miembro, procediendo con la solicitud...');

      // Crear solicitud de unión (ahora requiere autenticación por RLS)
      console.log('📝 Creando solicitud de unión:', {
        email: user.email,
        family_id: familyData.id,
        requester_user_id: user.id,
        message: message || 'Sin mensaje'
      });
      
      const { error: requestError } = await supabase
        .from('join_requests')
        .insert({
          email: user.email!,
          message: message || '',
          family_id: familyData.id,
          requester_user_id: user.id,
          status: 'pending'
        });

      if (requestError) {
        console.log('❌ Error creando solicitud:', requestError);
        throw requestError;
      }

      console.log('✅ Solicitud creada exitosamente');

      // Obtener administradores de la familia para notificarles
      console.log('📧 Buscando administradores para notificar...');
      const { data: adminsData, error: adminsError } = await supabase
        .from('family_members')
        .select('email, name')
        .eq('family_id', familyData.id)
        .eq('role', 'admin')
        .eq('active', true);

      if (!adminsError && adminsData && adminsData.length > 0) {
        console.log('👥 Administradores encontrados:', adminsData.length);
        
        // Enviar email a cada administrador
        for (const admin of adminsData) {
          if (admin.email) {
            try {
              console.log('📧 Enviando email a administrador:', admin.email);
              
              const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .content { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .button { 
                      display: inline-block; 
                      padding: 12px 24px; 
                      background-color: #007bff; 
                      color: white; 
                      text-decoration: none; 
                      border-radius: 5px;
                      margin: 20px 0;
                    }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                    .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Nueva Solicitud de Unión - FamiFlow</h1>
                    </div>
                    
                    <p>¡Hola ${admin.name}!</p>
                    
                    <div class="alert">
                      <strong>Tienes una nueva solicitud para unirse a tu familia "${familyData.name}"</strong>
                    </div>
                    
                    <div class="content">
                      <h3>Detalles de la Solicitud:</h3>
                      <p><strong>Email del solicitante:</strong> ${user.email}</p>
                      <p><strong>Familia:</strong> ${familyData.name}</p>
                _message ? `<p><strong>Mensaje:</strong> ${message}</p>` : ''}
                    </div>
                    
                    <p>Para revisar y aprobar esta solicitud, inicia sesión en FamiFlow y dirígete a la sección de gestión de familia.</p>
                    
                    <div style="text-align: center;">
                      <a href="${window.location.origin}/family" class="button">Revisar Solicitud</a>
                    </div>
                    
                    <div class="footer">
                      <p>Si no esperabas esta solicitud, puedes rechazarla desde la aplicación.</p>
                      <p>Este es un email automático de FamiFlow.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;

              const { error: emailError } = await supabase.functions.invoke('send-smtp-email', {
                body: {
                  to: admin.email,
                  subject: `Nueva solicitud para unirse a ${familyData.name}`,
                  html: emailHtml
                }
              });

              if (emailError) {
                console.error('❌ Error enviando email a', admin.email, ':', emailError);
              } else {
                console.log('✅ Email enviado exitosamente a', admin.email);
              }
            } catch (emailError) {
              console.error('❌ Error enviando email de notificación:', emailError);
            }
          }
        }
      } else {
        console.log('⚠️ No se encontraron administradores para notificar');
      }

      toast({
        title: "Solicitud enviada",
        description: `Tu solicitud para unirte a "${familyData.name}" ha sido enviada y notificada a los administradores`
      });

      return { data: familyData };
    } catch (error: any) {
      console.error('❌ Error en requestToJoinFamily:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud"
      });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Cargar solicitudes pendientes (solo para administradores)
  const loadJoinRequests = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('join_requests')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJoinRequests((data || []).map(req => ({
        ...req,
        status: req.status as 'pending' | 'approved' | 'rejected'
      })));
    } catch (error) {
      console.error('Error loading join requests:', error);
    }
  };

  // Aprobar/rechazar solicitud de unión
  const handleJoinRequest = async (requestId: string, action: 'approved' | 'rejected', role: string = 'visitor') => {
    if (!user) return;

    try {
      setLoading(true);

      // Obtener detalles de la solicitud
      const { data: requestData, error: requestError } = await supabase
        .from('join_requests')
        .select('*, families(name)')
        .eq('id', requestId)
        .single();

      if (requestError || !requestData) throw new Error('Solicitud no encontrada');

      if (action === 'approved') {
        // Agregar como miembro de la familia
        const { error: memberError } = await supabase
          .from('user_families')
          .insert({
            user_id: requestData.requester_user_id!,
            family_id: requestData.family_id,
            role,
            status: 'active'
          });

        if (memberError) throw memberError;

        // Crear perfil de miembro
        const { error: profileError } = await supabase
          .from('family_members')
          .insert({
            user_id: requestData.requester_user_id!,
            family_id: requestData.family_id,
            name: requestData.email.split('@')[0],
            email: requestData.email,
            role: role as 'admin' | 'editor' | 'visitor',
            active: true
          });

        if (profileError) throw profileError;
      }

      // Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by_user_id: user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: action === 'approved' ? "Solicitud aprobada" : "Solicitud rechazada",
        description: `La solicitud de ${requestData.email} ha sido ${action === 'approved' ? 'aprobada' : 'rechazada'}`
      });

      // Recargar solicitudes
      if (currentFamily) {
        await loadJoinRequests(currentFamily.id);
      }
    } catch (error: any) {
      console.error('Error handling join request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar miembros de la familia
  const loadFamilyMembers = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .eq('active', true)
        .order('role', { ascending: true });

      if (error) throw error;
      setFamilyMembers((data || []).map(member => ({
        ...member,
        role: member.role as 'admin' | 'editor' | 'visitor'
      })));
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  // Crear invitación (método seguro)
  const createInvitation = async (email: string, role: string = 'visitor') => {
    if (!currentFamily) return { error: 'No hay familia seleccionada' };

    try {
      setLoading(true);

      // Generar token seguro
      const token = crypto.randomUUID();
      
      // Crear invitación con el nuevo esquema seguro
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email_allowlist: email,
          family_id: currentFamily.id,
          suggested_role: role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
          uses_remaining: 1,
          created_by: user!.id,
          token,
          email_verified: false, // Requerirá verificación
          used_at: null,
          used_by_user_id: null
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar email de invitación con enlace seguro
      try {
        // El enlace ahora apunta a una página segura que validará el token y email
        const inviteUrl = `${window.location.origin}/invite?token=${token}&email=${encodeURIComponent(email)}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Invitación a FamiFlow</h1>
              </div>
              
              <p>¡Hola!</p>
              
              <div class="content">
                <p>Has sido invitado/a a unirte a la familia "<strong>${currentFamily.name}</strong>" en FamiFlow.</p>
                <p>Tu rol asignado será: <strong>${role === 'visitor' ? 'Visitante' : role === 'editor' ? 'Editor' : 'Administrador'}</strong></p>
              </div>
              
              <div class="warning">
                <strong>Importante:</strong> Esta invitación está vinculada a tu dirección de email (${email}) por seguridad.
              </div>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
              </div>
              
              <p><small>Esta invitación expira en 7 días y solo puede ser utilizada una vez.</small></p>
              
              <div class="footer">
                <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
                <p>Por tu seguridad, esta invitación solo funcionará si inicias sesión con el email ${email}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-smtp-email', {
          body: {
            to: email,
            subject: `Invitación para unirte a ${currentFamily.name} en FamiFlow`,
            html: emailHtml
          }
        });

        if (emailError) {
          console.error('Error sending invitation email:', emailError);
          toast({
            variant: "destructive",
            title: "Invitación creada",
            description: "La invitación fue creada pero no se pudo enviar el email"
          });
        } else {
          toast({
            title: "Invitación enviada",
            description: `Se ha enviado una invitación segura por email a ${email}`
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          variant: "destructive",
          title: "Invitación creada",
          description: "La invitación fue creada pero no se pudo enviar el email"
        });
      }

      return { data };
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la invitación"
      });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Aceptar invitación usando la función segura
  const acceptInvitation = async (token: string, userEmail: string) => {
    try {
      setLoading(true);

      // Llamar a la función RPC segura como función de Supabase
      const { data, error } = await supabase.rpc('validate_and_use_invitation' as any, {
        invitation_token: token,
        user_email: userEmail
      }) as { data: any, error: any };

      if (error) throw error;

      const result = data;
      if (result.success) {
        toast({
          title: "¡Bienvenido!",
          description: `Te has unido exitosamente a ${result.family_name} con el rol ${result.role}`
        });
        
        // Recargar familias para incluir la nueva
        await loadUserFamilies();
        return { success: true, familyId: result.family_id };
      } else {
        throw new Error(result.error || 'Error al procesar la invitación');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo aceptar la invitación"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserFamilies();
    }
  }, [user]);

  useEffect(() => {
    if (currentFamily) {
      loadFamilyMembers(currentFamily.id);
      if (currentFamily.userRole === 'admin') {
        loadJoinRequests(currentFamily.id);
      }
    }
  }, [currentFamily]);

  return {
    families,
    currentFamily,
    familyMembers,
    joinRequests,
    invitations,
    loading,
    setCurrentFamily,
    createFamily,
    requestToJoinFamilyByCode, // <<<--- SE HA AÑADIDO ESTA LÍNEA
    requestToJoinFamily,
    handleJoinRequest,
    createInvitation,
    acceptInvitation,
    loadJoinRequests,
    loadFamilyMembers
  };
};
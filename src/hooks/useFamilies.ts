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
  userRole?: 'admin' | 'editor' | 'viewer';
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
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
        userRole: uf.role as 'admin' | 'editor' | 'viewer'
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

  // Solicitar unirse a familia
  const requestToJoinFamily = async (familyPublicId: string, message?: string) => {
    if (!user) return { error: 'Usuario no autenticado' };

    try {
      setLoading(true);

      // Verificar que la familia existe
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('family_public_id', familyPublicId.toUpperCase())
        .single();

      if (familyError || !familyData) {
        throw new Error('ID de familia no encontrado');
      }

      // Verificar que el usuario no es ya miembro
      const { data: existingMember } = await supabase
        .from('user_families')
        .select('id')
        .eq('user_id', user.id)
        .eq('family_id', familyData.id)
        .single();

      if (existingMember) {
        throw new Error('Ya eres miembro de esta familia');
      }

      // Crear solicitud de unión
      const { error: requestError } = await supabase
        .from('join_requests')
        .insert({
          email: user.email!,
          message: message || '',
          family_id: familyData.id,
          requester_user_id: user.id,
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast({
        title: "Solicitud enviada",
        description: `Tu solicitud para unirte a "${familyData.name}" ha sido enviada`
      });

      return { data: familyData };
    } catch (error: any) {
      console.error('Error requesting to join family:', error);
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
  const handleJoinRequest = async (requestId: string, action: 'approved' | 'rejected', role: string = 'viewer') => {
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
            role: role as 'admin' | 'editor' | 'viewer',
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
        role: member.role as 'admin' | 'editor' | 'viewer'
      })));
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  // Crear invitación
  const createInvitation = async (email: string, role: string = 'viewer') => {
    if (!currentFamily) return { error: 'No hay familia seleccionada' };

    try {
      setLoading(true);

      const token = crypto.randomUUID();
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email_allowlist: email,
          family_id: currentFamily.id,
          suggested_role: role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
          uses_remaining: 1,
          created_by: user!.id,
          token
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar email de invitación via SMTP
      try {
        const inviteUrl = `${window.location.origin}/join?token=${token}`;
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Invitación a FamiFlow</h1>
              </div>
              
              <p>¡Hola!</p>
              
              <p>Has sido invitado/a a unirte a la familia "<strong>${currentFamily.name}</strong>" en FamiFlow.</p>
              
              <p>Tu rol asignado será: <strong>${role === 'viewer' ? 'Visitante' : role === 'editor' ? 'Editor' : 'Administrador'}</strong></p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${inviteUrl}
              </p>
              
              <p><small>Esta invitación expira en 7 días.</small></p>
              
              <div class="footer">
                <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
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
            description: `Se ha enviado una invitación por email a ${email}`
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
    requestToJoinFamily,
    handleJoinRequest,
    createInvitation,
    loadJoinRequests,
    loadFamilyMembers
  };
};
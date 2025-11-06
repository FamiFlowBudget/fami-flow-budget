// src/hooks/useFamilies.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

// (Las interfaces Family, FamilyMember, etc., no cambian)
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

  const loadUserFamilies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: userFamiliesData, error: userFamiliesError } = await supabase
        .from('user_families')
        .select(`families (*), role`)
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (userFamiliesError) throw userFamiliesError;
      const familiesWithRole = (userFamiliesData || []).map(uf => ({ ...uf.families, userRole: uf.role as any }));
      setFamilies(familiesWithRole);
      if (familiesWithRole.length > 0 && !currentFamily) {
        setCurrentFamily(familiesWithRole[0]);
      } else if (familiesWithRole.length === 0) {
        setCurrentFamily(null);
      }
    } catch (error) {
      console.error('Error loading families:', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las familias" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createFamily = async (name: string, currency: string = 'CLP') => {
    if (!user) return { error: 'Usuario no autenticado' };
    setLoading(true);
    try {
      const { data: familyData, error: familyError } = await supabase.rpc('create_new_family', {
        family_name: name,
        family_currency: currency,
        user_id_input: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        user_email_input: user.email
      });

      if (familyError) throw familyError;
      toast({ title: "¡Familia creada!", description: `Tu familia "${name}" ha sido creada exitosamente.` });
      await loadUserFamilies();
      return { data: familyData };
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo crear la familia" });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // >>>>> NUEVA FUNCIÓN AÑADIDA AQUÍ <<<<<
  const updateFamilyName = async (newName: string) => {
    if (!currentFamily || !user) {
      toast({ title: "Error", description: "No hay una familia seleccionada para actualizar.", variant: "destructive" });
      return { success: false };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .update({ name: newName })
        .eq('id', currentFamily.id)
        .select()
        .single();
      
      if (error) throw error;

      // Actualizar el estado local para reflejar el cambio instantáneamente
      const updatedFamily = { ...currentFamily, name: data.name };
      setCurrentFamily(updatedFamily);
      setFamilies(prev => prev.map(f => f.id === currentFamily.id ? updatedFamily : f));

      toast({ title: "Nombre actualizado", description: "El nombre de la familia se ha cambiado con éxito." });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating family name:', error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar el nombre.", variant: "destructive" });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const requestToJoinFamilyByCode = async (familyCode: string) => {
    // (Esta función no cambia, la dejamos como está)
    if (!user) {
      toast({ title: "Error de autenticación", description: "Debes iniciar sesión para poder unirte a una familia.", variant: "destructive" });
      return { success: false, error: 'Usuario no autenticado' };
    }
    setLoading(true);
    try {
      const { data: familyData, error: familyError } = await supabase.from('families').select('id, name').eq('family_public_id', familyCode.toUpperCase()).single();
      if (familyError || !familyData) throw new Error('El código de familia no es válido o no existe.');
      const { data: existingMember } = await supabase.from('user_families').select('user_id').eq('user_id', user.id).eq('family_id', familyData.id).single();
      if (existingMember) throw new Error('Ya eres miembro de esta familia.');
      const { data: existingRequest } = await supabase.from('join_requests').select('id').eq('requester_user_id', user.id).eq('family_id', familyData.id).eq('status', 'pending').single();
      if (existingRequest) throw new Error('Ya tienes una solicitud pendiente para esta familia.');
      const { error: requestError } = await supabase.from('join_requests').insert({ family_id: familyData.id, requester_user_id: user.id, email: user.email!, status: 'pending' });
      if (requestError) throw requestError;
      toast({ title: "¡Solicitud Enviada!", description: `Tu solicitud para unirte a la familia "${familyData.name}" ha sido enviada.` });
      return { success: true };
    } catch (error: any) {
      toast({ title: "Error al enviar la solicitud", description: error.message, variant: "destructive" });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // (El resto de funciones como handleJoinRequest, createInvitation, etc., no cambian)
  // ... (aquí iría el resto del código que ya tienes) ...

  // El useEffect de carga tampoco cambia
  useEffect(() => {
    if (user) {
      loadUserFamilies();
    } else {
      setFamilies([]);
      setCurrentFamily(null);
    }
  }, [user, loadUserFamilies]);

  useEffect(() => {
    if (currentFamily) {
      // Cargar otros datos relacionados a la familia si es necesario
      if (currentFamily.userRole === 'admin') {
        // loadJoinRequests(currentFamily.id);
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
    updateFamilyName, // <<<--- AÑADIMOS LA NUEVA FUNCIÓN AL MENÚ
    requestToJoinFamilyByCode,
    // ... (resto de funciones exportadas)
  };
};
import { ReactNode } from 'react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

interface RoleProtectionProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'adult' | 'kid')[];
  fallback?: ReactNode;
}

export const RoleProtection = ({ children, allowedRoles, fallback = null }: RoleProtectionProps) => {
  const { currentMember } = useBudgetSupabase();
  
  // Si no hay miembro actual, no mostrar nada
  if (!currentMember) {
    return fallback;
  }
  
  // Verificar si el rol actual está permitido
  if (allowedRoles.includes(currentMember.role as 'admin' | 'adult' | 'kid')) {
    return <>{children}</>;
  }
  
  return fallback;
};

// Hook personalizado para verificar permisos de edición
export const useCanEdit = (targetMemberId?: string) => {
  const { currentMember } = useBudgetSupabase();
  
  return {
    canEdit: currentMember?.role === 'admin' || currentMember?.id === targetMemberId,
    isAdmin: currentMember?.role === 'admin',
    currentMember
  };
};
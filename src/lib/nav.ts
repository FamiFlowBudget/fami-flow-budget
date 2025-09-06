import { Home, Receipt, Wallet, Upload, BarChart2, Layers, Tag, Bell } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  rolesAllowed: ('admin' | 'adult' | 'kid')[];
  description?: string;
}

export const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: Home,
    rolesAllowed: ['admin', 'adult', 'kid'],
    description: 'Panel principal y resumen'
  },
  {
    label: 'Gastos',
    href: '/expenses',
    icon: Receipt,
    rolesAllowed: ['admin', 'adult', 'kid'],
    description: 'Ver y gestionar gastos'
  },
  {
    label: 'Presupuestos',
    href: '/budget',
    icon: Wallet,
    rolesAllowed: ['admin', 'adult'],
    description: 'Configurar presupuestos familiares'
  },
  {
    label: 'Importar',
    href: '/import',
    icon: Upload,
    rolesAllowed: ['admin'],
    description: 'Importar datos desde archivos'
  },
  {
    label: 'Reportes',
    href: '/reports',
    icon: BarChart2,
    rolesAllowed: ['admin', 'adult'],
    description: 'Análisis y reportes detallados'
  },
  {
    label: 'Cuentas',
    href: '/accounts',
    icon: Layers,
    rolesAllowed: ['admin'],
    description: 'Gestionar cuentas bancarias'
  },
  {
    label: 'Categorías',
    href: '/categories',
    icon: Tag,
    rolesAllowed: ['admin'],
    description: 'Organizar categorías de gastos'
  },
  {
    label: 'Alertas',
    href: '/alerts',
    icon: Bell,
    rolesAllowed: ['admin', 'adult'],
    description: 'Alertas y notificaciones'
  }
];

export const getVisibleNavItems = (userRole: 'admin' | 'adult' | 'kid' | null) => {
  if (!userRole) return [];
  return navItems.filter(item => item.rolesAllowed.includes(userRole));
};
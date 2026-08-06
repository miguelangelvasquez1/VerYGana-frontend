import {
  LayoutGrid,
  ShoppingCart,
  Megaphone,
  ClipboardList,
  Gamepad2,
  Share2,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { PlanCode } from '@/types/finance/plans/Plan.types';

export type SectionId =
  | 'overview'
  | 'sales'
  | 'ads'
  | 'surveys'
  | 'games'
  | 'referrals'
  | 'premium';

export interface SectionConfig {
  id: SectionId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** null = disponible para todos los planes con acceso al panel */
  allowedPlans: PlanCode[] | null;
  lockedMessage: string;
}

// Mapeo 1:1 con la tabla "4. Métricas (diferenciación por plan)" del documento comercial.
export const ANALYTICS_SECTIONS: SectionConfig[] = [
  {
    id: 'overview',
    label: 'Resumen general',
    shortLabel: 'Resumen',
    description: 'Lo más importante de cada sección en un solo vistazo.',
    icon: LayoutGrid,
    allowedPlans: null,
    lockedMessage: '',
  },
  {
    id: 'sales',
    label: 'Estadísticas de ventas',
    shortLabel: 'Ventas',
    description: 'Ganancias y desempeño de tus productos vendidos.',
    icon: ShoppingCart,
    allowedPlans: [PlanCode.BASIC, PlanCode.STANDARD],
    lockedMessage: 'El plan Premium no vende productos, por lo que esta sección no aplica.',
  },
  {
    id: 'ads',
    label: 'Estadísticas de anuncios',
    shortLabel: 'Anuncios',
    description: 'Impresiones, clicks y CTR de tus anuncios.',
    icon: Megaphone,
    allowedPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockedMessage: 'Disponible en los planes Estándar y Premium.',
  },
  {
    id: 'surveys',
    label: 'Estadísticas de encuestas',
    shortLabel: 'Encuestas',
    description: 'Participación y resultados de tus encuestas.',
    icon: ClipboardList,
    allowedPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockedMessage: 'Disponible en los planes Estándar y Premium.',
  },
  {
    id: 'games',
    label: 'Estadísticas de juegos',
    shortLabel: 'Juegos',
    description: 'Actividad de tus juegos patrocinados.',
    icon: Gamepad2,
    allowedPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockedMessage: 'Disponible en los planes Estándar y Premium.',
  },
  {
    id: 'referrals',
    label: 'Métricas de remisión',
    shortLabel: 'Remisión',
    description: 'Impresiones y clics generados por remisión.',
    icon: Share2,
    allowedPlans: [PlanCode.PREMIUM],
    lockedMessage: 'Exclusivo del plan Premium.',
  },
  {
    id: 'premium',
    label: 'Métricas Premium',
    shortLabel: 'Premium',
    description: 'Visualizaciones de tu página oficial y consumo en la tienda de mascotas.',
    icon: Crown,
    allowedPlans: [PlanCode.PREMIUM],
    lockedMessage: 'Exclusivo del plan Premium.',
  },
];

export function hasPlanAccess(
  effectivePlan: PlanCode | null | undefined,
  allowedPlans: PlanCode[] | null,
): boolean {
  if (allowedPlans === null) return true;
  return effectivePlan != null && allowedPlans.includes(effectivePlan);
}

export function getSection(id: SectionId): SectionConfig {
  return ANALYTICS_SECTIONS.find((s) => s.id === id)!;
}

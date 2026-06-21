export type FeatureStatus = 'ENABLED' | 'READ_ONLY' | 'MAINTENANCE' | 'DISABLED';

export interface SystemFeature {
  id: number;
  featureKey: string;
  endpointPrefix: string;
  status: FeatureStatus;
  category: string;
  description: string;
  updatedAt: string;
}

/** Converts any SNAKE_CASE category string from the backend into a readable label. */
export function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const STATUS_LABELS: Record<FeatureStatus, string> = {
  ENABLED: 'Habilitado',
  READ_ONLY: 'Solo lectura',
  MAINTENANCE: 'Mantenimiento',
  DISABLED: 'Deshabilitado',
};

export const STATUS_DESCRIPTIONS: Record<FeatureStatus, string> = {
  ENABLED: 'El módulo funciona con normalidad. Todos los usuarios pueden acceder sin restricciones.',
  READ_ONLY: 'Solo se permiten operaciones de lectura (GET). Las escrituras quedan bloqueadas para todos los usuarios.',
  MAINTENANCE: 'Todos los accesos al módulo están bloqueados. Los usuarios verán un mensaje de mantenimiento.',
  DISABLED: 'El módulo está completamente apagado. Ninguna solicitud será procesada y el servicio retornará 503.',
};

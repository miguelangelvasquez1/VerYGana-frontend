export type FeatureStatus = 'ENABLED' | 'READ_ONLY' | 'MAINTENANCE' | 'DISABLED';

export type FeatureCategory =
  | 'MONETIZATION'
  | 'MARKETPLACE'
  | 'FINANCIAL'
  | 'USER_ACQUISITION'
  | 'ENGAGEMENT'
  | 'USER_PROFILES'
  | 'ADMINISTRATION';

export interface SystemFeature {
  id: number;
  featureKey: string;
  endpointPrefix: string;
  status: FeatureStatus;
  category: FeatureCategory;
  description: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  MONETIZATION: 'Monetización',
  MARKETPLACE: 'Marketplace',
  FINANCIAL: 'Sistema Financiero',
  USER_ACQUISITION: 'Adquisición de Usuarios',
  ENGAGEMENT: 'Engagement',
  USER_PROFILES: 'Perfiles de Usuario',
  ADMINISTRATION: 'Administración',
};

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

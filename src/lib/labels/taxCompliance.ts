// Diccionario único de textos y colores de la ficha tributaria, el expediente, el
// compromiso de formalización y los requerimientos (sección 3 del contrato con la API).
// Toda insignia de estas pantallas sale de aquí, para que un mismo estado se lea igual
// en todos los sitios.
import type {
  CommercialDocumentReviewStatus,
  CommercialDocumentType,
} from '@/types/commercial/Expediente.types';
import type { ManifestationStatus } from '@/types/commercial/Declaration.types';
import type {
  EstablishmentRelation,
  IncomeConcept,
  IncomeScope,
  SectionReviewResult,
  TaxCatalogType,
  TaxProfileSection,
  TaxProfileStatus,
} from '@/types/commercial/TaxProfile.types';
import type {
  AccountStatus,
  ContractualMeasure,
  FindingClassification,
  FindingSeverity,
  InformationRequestStatus,
  InformationRequestTrigger,
  RequestCommunication,
  RequestItemType,
} from '@/types/compliance/InformationRequest.types';

export type Tone = 'blue' | 'orange' | 'green' | 'gray' | 'red';

export interface ToneLabel {
  label: string;
  tone: Tone;
}

export const TAX_PROFILE_STATUS_LABELS: Record<TaxProfileStatus, ToneLabel> = {
  SUBMITTED: { label: 'En revisión', tone: 'blue' },
  OBSERVED: { label: 'Con observaciones', tone: 'orange' },
  REVIEWED: { label: 'Revisada', tone: 'green' },
};

export const SECTION_REVIEW_LABELS: Record<SectionReviewResult, ToneLabel> = {
  VERIFIED: { label: 'Verificada', tone: 'green' },
  OBSERVED: { label: 'Observada', tone: 'orange' },
  NOT_APPLICABLE: { label: 'No aplica', tone: 'gray' },
};

// Sección que todavía no tiene revisión.
export const SECTION_REVIEW_PENDING: ToneLabel = { label: 'Pendiente de revisión', tone: 'gray' };

export const DOCUMENT_REVIEW_LABELS: Record<CommercialDocumentReviewStatus, ToneLabel> = {
  NOT_REVIEWED: { label: 'Sin revisar', tone: 'gray' },
  ACCEPTED: { label: 'Aceptado', tone: 'green' },
  OBSERVED: { label: 'Con observaciones', tone: 'orange' },
  REJECTED: { label: 'Rechazado', tone: 'red' },
};

// Documento con `expired = true`.
export const DOCUMENT_EXPIRED_LABEL: ToneLabel = { label: 'Vencido', tone: 'red' };

// Cuatro estados, cuatro textos distintos: la falla técnica nunca se presenta como negativa.
export const MANIFESTATION_LABELS: Record<ManifestationStatus, ToneLabel> = {
  MANIFESTED: { label: 'Manifestado', tone: 'green' },
  NOT_MANIFESTED: { label: 'Sin manifestar — pendiente de aclaración', tone: 'orange' },
  EXPRESS_REFUSAL: { label: 'No aceptado', tone: 'red' },
  TECHNICAL_INCIDENT: { label: 'Falla técnica — pendiente de aclaración', tone: 'gray' },
};

// Vista del empresario.
export const REQUEST_STATUS_LABELS_COMMERCIAL: Record<InformationRequestStatus, ToneLabel> = {
  OPEN: { label: 'Pendiente de tu respuesta', tone: 'orange' },
  RESPONDED: { label: 'En revisión por VERYGANA', tone: 'blue' },
  OBSERVED: { label: 'Con observaciones', tone: 'orange' },
  CLOSED_SATISFIED: { label: 'Resuelto', tone: 'green' },
  CLOSED_WITH_FINDING: { label: 'Cerrado con hallazgo', tone: 'gray' },
  CANCELLED: { label: 'Anulado', tone: 'gray' },
};

// Vista de cumplimiento.
export const REQUEST_STATUS_LABELS_COMPLIANCE: Record<InformationRequestStatus, ToneLabel> = {
  OPEN: { label: 'Esperando respuesta', tone: 'orange' },
  RESPONDED: { label: 'Por revisar', tone: 'blue' },
  OBSERVED: { label: 'Con observaciones', tone: 'orange' },
  CLOSED_SATISFIED: { label: 'Resuelto', tone: 'green' },
  CLOSED_WITH_FINDING: { label: 'Cerrado con hallazgo', tone: 'gray' },
  CANCELLED: { label: 'Anulado', tone: 'gray' },
};

export const INCOME_SCOPE_LABELS: Record<IncomeScope, string> = {
  EXTERNAL_ONLY: 'Solo operaciones fuera de VERYGANA',
  PLATFORM_ONLY: 'Solo operaciones en VERYGANA',
  CONSOLIDATED_INCLUDES_PLATFORM: 'Total que ya incluye VERYGANA',
};

export const INCOME_CONCEPT_LABELS: Record<IncomeConcept, string> = {
  INGRESOS: 'Ingresos',
  VENTAS: 'Ventas',
  RECAUDOS: 'Recaudos',
};

export const ESTABLISHMENT_RELATION_LABELS: Record<EstablishmentRelation, string> = {
  OWNED: 'Propio',
  LEASED: 'Arrendado',
  FRANCHISE: 'Franquicia',
  OTHER: 'Otro',
};

export const CONTRACTUAL_MEASURE_LABELS: Record<ContractualMeasure, string> = {
  NONE: 'Sin medida',
  WARNING: 'Advertencia',
  PREVENTIVE_RESTRICTION: 'Restricción preventiva',
  SUSPENSION: 'Suspensión',
  TERMINATION_REFERRAL: 'Remisión a terminación',
};

export const FINDING_CLASSIFICATION_LABELS: Record<FindingClassification, string> = {
  SUBSANABLE_ERROR: 'Error subsanable',
  LACK_OF_UPDATE: 'Falta de actualización',
  ISOLATED_INCONSISTENCY: 'Inconsistencia aislada',
  VERIFIED_FALSE_INFO: 'Información falsa verificada',
  EXPRESS_REFUSAL: 'Negativa expresa',
};

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

// Mismos textos que `userStateLabel` del portal de administración.
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  REGISTRATION_STARTED: 'Registro iniciado',
  PENDING_ACCEPTANCE: 'Pendiente de aceptar términos',
  PENDING_VERIFICATION: 'Pendiente de verificación',
  PENDING_ACTIVATION: 'Pendiente de activación',
  ACTIVE: 'Activa',
  PREVENTIVELY_RESTRICTED: 'Restringida preventivamente',
  SUSPENDED: 'Suspendida',
  TERMINATED: 'Terminada',
};

// El orden de las claves es el orden de las secciones a) a h).
export const TAX_PROFILE_SECTION_TITLES: Record<TaxProfileSection, string> = {
  A_RUT: 'a) RUT',
  B_REGIME_ACTIVITIES: 'b) Régimen y actividades',
  C_VAT_INC: 'c) IVA e INC',
  D_INVOICING_WITHHOLDING: 'd) Facturación y retención',
  E_INCOME: 'e) Ingresos o ventas',
  F_ESTABLISHMENTS: 'f) Establecimientos',
  G_GROWTH_CAPACITY: 'g) Capacidad de crecimiento',
  H_ADVISORY: 'h) Asesoría contable',
};

export const TRIGGER_LABELS: Record<InformationRequestTrigger, string> = {
  DOCUMENT_EXPIRED: 'Documento vencido',
  ACTIVITY_CHANGE: 'Cambio de actividad',
  ESTABLISHMENT_CHANGE: 'Cambio de establecimientos',
  MATERIAL_OPERATION_INCREASE: 'Aumento de operación',
  NEW_REQUIREMENT: 'Nuevo requisito',
  INCONSISTENCY: 'Inconsistencia',
  INCIDENT: 'Incidente',
  RISK: 'Riesgo',
  MISSING_MANIFESTATION: 'Compromiso sin manifestar',
  EXPRESS_REFUSAL: 'Negativa al compromiso',
};

// Tipos de documento del expediente (mismos textos que el asistente de registro).
export const COMMERCIAL_DOCUMENT_TYPE_LABELS: Record<CommercialDocumentType, string> = {
  RUT: 'RUT',
  CAMARA_COMERCIO: 'Cámara de Comercio',
  CEDULA_REPRESENTANTE: 'Cédula del representante legal',
  CERTIFICACION_BANCARIA: 'Certificación bancaria',
  PERMISO_SECTORIAL: 'Permiso sectorial',
  MARCA_REGISTRADA: 'Marca registrada',
  OTRO: 'Otro documento',
};

export const TAX_CATALOG_TYPE_LABELS: Record<TaxCatalogType, string> = {
  REGIME: 'Régimen',
  RUT_RESPONSIBILITY: 'Responsabilidades del RUT',
  VAT_CONDITION: 'Condición de IVA',
  INC_CONDITION: 'Condición de INC',
  INVOICING_METHOD: 'Método de facturación',
};

export const REQUEST_ITEM_TYPE_LABELS: Record<RequestItemType, string> = {
  DOCUMENT: 'Documento',
  FIELD: 'Campo',
  CLARIFICATION: 'Aclaración',
};

export const COMMUNICATION_CHANNEL_LABELS: Record<RequestCommunication['channel'], string> = {
  IN_APP: 'En la aplicación',
  EMAIL: 'Correo electrónico',
};

export const DELIVERY_STATUS_LABELS: Record<RequestCommunication['deliveryStatus'], ToneLabel> = {
  SENT: { label: 'Enviada', tone: 'green' },
  FAILED: { label: 'Falló', tone: 'red' },
};

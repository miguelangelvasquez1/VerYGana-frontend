import type { Manifestation } from './Declaration.types';

export type TaxProfileStatus = 'SUBMITTED' | 'OBSERVED' | 'REVIEWED';
export type TaxProfileSection =
  | 'A_RUT' | 'B_REGIME_ACTIVITIES' | 'C_VAT_INC' | 'D_INVOICING_WITHHOLDING'
  | 'E_INCOME' | 'F_ESTABLISHMENTS' | 'G_GROWTH_CAPACITY' | 'H_ADVISORY';
export type SectionReviewResult = 'VERIFIED' | 'OBSERVED' | 'NOT_APPLICABLE';
export type IncomeConcept = 'INGRESOS' | 'VENTAS' | 'RECAUDOS';
export type IncomeScope = 'EXTERNAL_ONLY' | 'PLATFORM_ONLY' | 'CONSOLIDATED_INCLUDES_PLATFORM';
export type TaxCatalogType = 'REGIME' | 'RUT_RESPONSIBILITY' | 'VAT_CONDITION' | 'INC_CONDITION' | 'INVOICING_METHOD';
export type EstablishmentRelation = 'OWNED' | 'LEASED' | 'FRANCHISE' | 'OTHER';
export type EstablishmentStatus = 'ACTIVE' | 'CLOSED';
export type CommercialActivityType = 'PRODUCTS' | 'SERVICES';

// ---------- Peticiones ----------
export interface ActivityInput {
  ciiuCode: string;          // exactamente 4 dígitos
  description?: string;      // máx 300
  main: boolean;             // exactamente una en true
}

export interface IncomeReportInput {
  concept: IncomeConcept;
  periodStart: string;       // YYYY-MM-DD
  periodEnd: string;         // YYYY-MM-DD, >= periodStart y <= hoy
  amountCents: number;       // >= 0
  currency: string;          // 3 letras mayúsculas, por defecto 'COP'
  scope: IncomeScope;
  supportDocumentId?: number | null;
  notes?: string;            // máx 500
}

export interface TaxProfileSubmitRequest {
  // a) RUT
  rutDocumentId?: number | null;
  rutResponsibilityCodes: string[];            // códigos RUT_RESPONSIBILITY, sin repetir
  // b) Régimen y actividades
  regimeCode?: string | null;                  // código REGIME
  activities: ActivityInput[];                 // mínimo 1
  // c) IVA e INC
  vatConditionCode?: string | null;            // código VAT_CONDITION
  incConditionCode?: string | null;            // código INC_CONDITION
  taxConditionScope?: string;                  // máx 1000
  // d) Facturación y retención
  invoicingObligated: boolean;
  invoicingMethodCode?: string | null;         // código INVOICING_METHOD
  invoicingNotes?: string;                     // máx 1000
  withholdingAgent: boolean;
  withholdingNotes?: string;                   // máx 1000
  // e) Ingresos o ventas
  incomeReports: IncomeReportInput[];          // mínimo 1
  // g) Capacidad de crecimiento
  currentCapacity: string;                     // obligatorio, máx 2000
  growthScenario?: string;                     // máx 2000
  growthMeasures?: string;                     // máx 2000
  // h) Asesoría
  hasAccountingAdvisor: boolean;
  advisorScope?: string;                       // máx 1000
}

export interface EstablishmentRequest {
  name: string;                // máx 150
  address: string;             // máx 300, dirección física
  municipalityCode: string;    // código DANE de 5 dígitos
  relation: EstablishmentRelation;
}
export interface CloseEstablishmentRequest { reason: string } // obligatorio, máx 300

export interface SectionReviewRequest { result: SectionReviewResult; notes?: string } // notes obligatorio si OBSERVED

export interface CatalogEntryRequest {
  catalogType: TaxCatalogType;
  code: string;          // máx 30
  label: string;         // máx 200
  legalBasis: string;    // máx 500, obligatorio
  validFrom: string;     // YYYY-MM-DD
}
export interface RetireCatalogEntryRequest { validTo: string } // YYYY-MM-DD

// ---------- Respuestas ----------
export interface Activity { ciiuCode: string; description: string | null; main: boolean }
export interface IncomeReport {
  concept: IncomeConcept; periodStart: string; periodEnd: string; amountCents: number;
  currency: string; scope: IncomeScope; supportDocumentId: number | null; notes: string | null;
}
export interface TaxProfileVersionDetail {
  versionNumber: number;
  submittedAt: string;
  rutDocumentId: number | null;
  rutResponsibilityCodes: string[];
  regimeCode: string | null;
  activities: Activity[];
  vatConditionCode: string | null;
  incConditionCode: string | null;
  taxConditionScope: string | null;
  invoicingObligated: boolean;
  invoicingMethodCode: string | null;
  invoicingNotes: string | null;
  withholdingAgent: boolean;
  withholdingNotes: string | null;
  incomeReports: IncomeReport[];
  establishmentsCount: number;   // activos al momento del envío
  currentCapacity: string;
  growthScenario: string | null;
  growthMeasures: string | null;
  hasAccountingAdvisor: boolean;
  advisorScope: string | null;
}
export interface SectionReview {
  section: TaxProfileSection; result: SectionReviewResult; notes: string | null; reviewedAt: string;
}
export interface Establishment {
  id: number; name: string; address: string; municipalityCode: string; municipalityName: string;
  relation: EstablishmentRelation; status: EstablishmentStatus; createdAt: string;
  closedAt: string | null; closedReason: string | null;
}
export interface TaxProfileResponse {
  status: TaxProfileStatus;
  currentVersion: number;
  updatedAt: string;
  version: TaxProfileVersionDetail;
  sectionReviews: SectionReview[];             // una por sección revisada; si falta, está pendiente
  activeEstablishments: Establishment[];
  formalizationCommitment: Manifestation | null; // de types/declarations.ts
}
export interface VersionSummary { versionNumber: number; submittedAt: string }
export interface CatalogEntry {
  id: number; catalogType: TaxCatalogType; code: string; label: string; legalBasis: string;
  validFrom: string; validTo: string | null; active: boolean;
}
// Compliance
export interface TaxProfileSummary {
  commercialPublicId: string; companyName: string; status: TaxProfileStatus;
  currentVersion: number; updatedAt: string;
}
export interface ComplianceTaxProfileResponse {
  commercialPublicId: string;
  companyName: string;
  nit: string;
  commercialActivityType: CommercialActivityType | null; // solo para contrastar
  profile: TaxProfileResponse;
  versions: VersionSummary[];
  establishmentHistory: Establishment[];                 // activos y cerrados
}

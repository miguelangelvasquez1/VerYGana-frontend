import apiClient from "@/lib/api/client";
import type {
  ContractStatus,
  OnboardingDocument,
  OnboardingRoute,
  OnboardingStep,
  OnboardingSummaryLegalIdentification,
  OnboardingSummaryPlan,
} from "@/services/commercial/OnboardingService";

// ── Types ────────────────────────────────────────────────────────────────────

export type ScreeningList =
  | 'OFAC_SDN'
  | 'UN'
  | 'ATTORNEY_GENERAL'
  | 'COMPTROLLER'
  | 'NATIONAL_POLICE';

export interface KycPendingEntry {
  id: number;
  email: string;
  phoneNumber: string;
  role: string;
  registeredDate: string;
  // personal KYC fields
  name?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  isPep?: boolean;
  // commercial only
  companyName?: string;
  nit?: string;
  ciiuCode?: string;
  legalRepDocType?: string;
  legalRepDocNumber?: string;
}

export interface ScreeningHit {
  id: number;
  queriedName: string;
  documentNumber: string;
  listName: ScreeningList;
  status: "HIT" | "FUZZY_HIT";
  reviewed: boolean;
  createdAt: string;
}

export interface ScreeningHistoryEntry extends ScreeningHit {
  notes?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  category: string;
  success: boolean;
  createdAt: string;
  details?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  level?: string;
  category?: string;
  success?: boolean;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

// ── KYC ──────────────────────────────────────────────────────────────────────

export const getPendingKyc = async (): Promise<KycPendingEntry[]> => {
  const res = await apiClient.get("/compliance/kyc/pending");
  return res.data;
};

export const approveKyc = async (id: number): Promise<void> => {
  await apiClient.post(`/compliance/kyc/${id}/approve`);
};

export const rejectKyc = async (id: number, reason: string): Promise<void> => {
  await apiClient.post(`/compliance/kyc/${id}/reject`, null, {
    params: { reason },
  });
};

// ── Screenings ────────────────────────────────────────────────────────────────

export const getScreeningHits = async (
  page = 0,
  size = 20
): Promise<PageResponse<ScreeningHit>> => {
  const res = await apiClient.get("/compliance/screenings/hits", {
    params: { page, size },
  });
  return res.data;
};

export const getUserScreeningHistory = async (
  userId: number
): Promise<ScreeningHistoryEntry[]> => {
  const res = await apiClient.get(`/compliance/screenings/user/${userId}`);
  return res.data;
};

export const reviewScreening = async (
  id: number,
  notes: string
): Promise<void> => {
  await apiClient.post(`/compliance/screenings/${id}/review`, null, {
    params: { notes },
  });
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const getAuditLogs = async (
  filters: AuditLogFilters
): Promise<PageResponse<AuditLog>> => {
  const { page = 0, size = 20, ...rest } = filters;
  const params: Record<string, any> = { page, size };
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params[k] = v;
  });
  const res = await apiClient.get("/compliance/audit-logs", { params });
  return res.data;
};

export const getCriticalAuditLogs = async (
  from?: string,
  to?: string,
  page = 0,
  size = 20
): Promise<PageResponse<AuditLog>> => {
  const res = await apiClient.get("/compliance/audit-logs/critical", {
    params: { from, to, page, size },
  });
  return res.data;
};

// ── Contratos comerciales (paso 11 del onboarding) ──────────────────────────

// Estados que puede devolver el listado — PENDING_BUSINESS_REVIEW nunca aparece aquí.
export type ContractReviewListStatus = Extract<
  ContractStatus,
  "PENDING_VERYGANA_REVIEW" | "APPROVED" | "REJECTED"
>;

export interface PendingContractSummary {
  contractId: number;
  userId: number;
  companyName: string;
  email: string;
  route: OnboardingRoute;
  version: number;
  generatedAt: string;
  businessApprovedAt: string | null;
  status: ContractReviewListStatus;
  veryganaReviewedAt: string | null;
  // true si el representante legal fue declarado (o dio hit de screening)
  // como PEP — compliance debe tenerlo en cuenta al revisar/aprobar.
  pep: boolean;
}

export interface ContractReviewDetail {
  contractId: number;
  version: number;
  status: ContractStatus;
  generatedAt: string;
  downloadUrl: string;
  businessApprovedAt: string | null;
  veryganaReviewedAt: string | null;
  veryganaDecisionNotes: string | null;
  // Documentos cargados por el comercial (descartados/ORPHANED no aparecen).
  // downloadUrl de cada uno viene null si no está VALIDATED, y las URLs
  // (tanto esta como la del contrato) expiran a los ~5 min — no reutilizar.
  documents: OnboardingDocument[];
}

export const getContracts = async (
  status?: ContractReviewListStatus
): Promise<PendingContractSummary[]> => {
  const res = await apiClient.get("/compliance/contracts", {
    params: status ? { status } : undefined,
  });
  return res.data;
};

export const getContractForReview = async (contractId: number): Promise<ContractReviewDetail> => {
  const res = await apiClient.get(`/compliance/contracts/${contractId}`);
  return res.data;
};

export const approveContractReview = async (contractId: number): Promise<void> => {
  await apiClient.post(`/compliance/contracts/${contractId}/approve`);
};

export const rejectContractReview = async (
  contractId: number,
  reason: string,
  documentsIssue: boolean
): Promise<void> => {
  await apiClient.post(`/compliance/contracts/${contractId}/reject`, { reason, documentsIssue });
};

// Fallback manual — en producción la firma se marca sola vía webhook de
// ZapSign. Hoy solo lo consume el panel de cambios de plan (ver
// PlanChangesReviewPanel), no el de onboarding.
export const markContractSigned = async (contractId: number): Promise<void> => {
  await apiClient.post(`/compliance/contracts/${contractId}/esignature/mark-signed`);
};

// ── Negociaciones pendientes (rutas D/E) ────────────────────────────────────
// Casos de integración técnica (D) o condiciones a la medida (E) que todavía
// no tienen contrato generado — compliance debe resolverlos antes de que el
// comercial pueda continuar su onboarding.

export type NegotiationRoute = Extract<OnboardingRoute, "D" | "E">;

export interface PendingNegotiation {
  onboardingId: number;
  companyName: string;
  email: string;
  phoneNumber: string;
  route: NegotiationRoute;
  routeExplanation: string;
  // Uno de los dos viene con texto según la ruta: integrationDetails en D,
  // specialNegotiationDetails en E.
  integrationDetails: string | null;
  specialNegotiationDetails: string | null;
  currentStep: OnboardingStep;
  classifiedAt: string;
  // true si el representante legal fue declarado (o dio hit de screening)
  // como PEP — mismo criterio que en listContracts.
  pep: boolean;
  // Contexto jurídico completo, para no depender de otro fetch antes de
  // contactar al empresario — misma forma que en el resumen del comercial.
  legalIdentification: OnboardingSummaryLegalIdentification;
  // null en Ruta D (nunca llega a elegir plan). En Ruta E sí trae el plan
  // aceptado — misma forma que en el resumen del comercial.
  plan: OnboardingSummaryPlan | null;
}

export const getPendingNegotiations = async (): Promise<PendingNegotiation[]> => {
  const res = await apiClient.get("/compliance/contracts/negotiations");
  return res.data;
};

// Sin body — solo marca el caso como resuelto.
export const resolveNegotiation = async (onboardingId: number): Promise<void> => {
  await apiClient.post(`/compliance/contracts/negotiations/${onboardingId}/resolve`);
};

// ── Antecedentes (ZapSign Background Checks) ────────────────────────────────
// Consulta manual y explícita del representante legal (y de la empresa, si es
// persona jurídica) contra el proveedor ZapSign. Tiene costo por consulta, así
// que nunca se dispara sola ni se reintenta automáticamente. El resultado real
// llega por webhook al backend — el refresh puntual es solo para cuando el
// compliance officer quiere confirmar en el momento (ZapSign tarda 2-20 min).

export type BackgroundCheckType = "PERSON" | "COMPANY";

export type BackgroundCheckStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "DELAYED"
  | "ERROR"
  | "COMPLETED";

export interface BackgroundCheck {
  id: number;
  contractId: number;
  checkId: string;
  checkType: BackgroundCheckType;
  country: string;
  subjectName: string;
  subjectDocument: string;
  status: BackgroundCheckStatus;
  // 0-1 desde ZapSign (10 = sin hallazgos negativos, decrece con la
  // severidad). null hasta que la consulta avanza.
  score: number | null;
  pdfReportUrl: string | null;
  requestedByOfficerId: number;
  requestedAt: string;
  completedAt: string | null;
}

export interface BackgroundCheckDetailCell {
  label: string;
  value: string;
}

export interface BackgroundCheckDetailRow {
  cells: BackgroundCheckDetailCell[];
}

export interface BackgroundCheckDetailTable {
  title: string;
  rows: BackgroundCheckDetailRow[];
}

export type BackgroundCheckFindingResult =
  | "found"
  | "not_found"
  | "error"
  | "delayed"
  | "expired"
  | "skipped";

export type BackgroundCheckFindingSeverity =
  | "none"
  | "unknown"
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

// Forma cruda tal como la entrega ZapSign — no hay tipo fijo, cada
// data_set/fuente trae sus propias tables/rows, así que se renderiza genérico.
export interface BackgroundCheckFinding {
  data_set: string;
  database_name: string;
  result: BackgroundCheckFindingResult;
  severity: BackgroundCheckFindingSeverity;
  found_first_name?: string;
  found_last_name?: string;
  tables?: BackgroundCheckDetailTable[];
  update_date?: string;
}

export interface BackgroundCheckDetail {
  details: BackgroundCheckFinding[];
  next: string;
}

// Dispara una consulta nueva — siempre un registro PERSON (representante
// legal), más uno COMPANY si el comercio es persona jurídica.
export const triggerBackgroundChecks = async (contractId: number): Promise<BackgroundCheck[]> => {
  const res = await apiClient.post(`/compliance/contracts/${contractId}/background-checks`);
  return res.data;
};

export const getBackgroundChecks = async (contractId: number): Promise<BackgroundCheck[]> => {
  const res = await apiClient.get(`/compliance/contracts/${contractId}/background-checks`);
  return res.data;
};

export const refreshBackgroundCheck = async (id: number): Promise<BackgroundCheck> => {
  const res = await apiClient.post(`/compliance/contracts/background-checks/${id}/refresh`);
  return res.data;
};

export const getBackgroundCheckDetail = async (id: number): Promise<BackgroundCheckDetail> => {
  const res = await apiClient.get(`/compliance/contracts/background-checks/${id}/detail`);
  return res.data;
};

import apiClient from "@/lib/api/client";
import { PlanCode } from "@/types/finance/plans/Plan.types";

// ── Types ────────────────────────────────────────────────────────────────────

export type OnboardingStep =
  | "TERMS_PENDING"
  | "LEGAL_IDENTIFICATION_PENDING"
  | "DIAGNOSTIC_PENDING"
  | "CLASSIFICATION_PENDING"
  | "PLAN_PENDING"
  | "DOCUMENTS_PENDING"
  | "CONTRACT_PENDING"
  | "BUSINESS_REVIEW_PENDING"
  | "VERYGANA_REVIEW_PENDING"
  | "COMPLETED";

export type OnboardingRoute = "A" | "B" | "C" | "D" | "E";

export interface ClassificationResult {
  route: OnboardingRoute;
  routeLabel: string;
  explanation: string;
  confirmed: boolean;
}

export type ContractStatus =
  | "PENDING_BUSINESS_REVIEW"
  | "PENDING_VERYGANA_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface OnboardingStatus {
  currentStep: OnboardingStep;
  termsAccepted: boolean;
  legalIdentificationCompleted: boolean;
  diagnosticCompleted: boolean;
  routeClassified: boolean;
  routeConfirmed: boolean;
  classification: ClassificationResult | null;
  planAccepted: boolean;
  documentsCompleted: boolean;
  contractGenerated: boolean;
  contractStatus: ContractStatus | null;
  businessApproved: boolean;
  veryganaReviewed: boolean;
  completed: boolean;
  // Ambos null salvo que contractStatus === "REJECTED". Si documentsCompleted
  // es false el rechazo fue documental (currentStep vuelve a DOCUMENTS_PENDING,
  // autoservicio disponible); si es true, no hay autoservicio (currentStep se
  // queda en VERYGANA_REVIEW_PENDING, lo resuelve VerYGana manualmente).
  rejectionReason: string | null;
  rejectedAt: string | null;
}

export interface TermsAcceptRequest {
  termsVersion: string;
  accepted: boolean;
}

export type PersonType = "NATURAL" | "JURIDICA";
export type LegalRepDocType = "CC" | "CE" | "PP";

export type AnnualIncomeRange =
  | "LESS_THAN_500_SMMLV"
  | "FROM_500_TO_5000_SMMLV"
  | "FROM_5000_TO_50000_SMMLV"
  | "MORE_THAN_50000_SMMLV";

export interface LegalIdentificationRequest {
  personType: PersonType;
  // Requerida si personType=JURIDICA (422 si falta). Si personType=NATURAL
  // es opcional — si no se envía, el backend la autocompleta con el nombre
  // completo del representante legal.
  companyName?: string;
  // Requerido para ambos tipos de persona (NATURAL y JURIDICA).
  nit: string;
  mercantileRegistration?: string;
  legalRepFirstName: string;
  legalRepLastName: string;
  legalRepDocType: LegalRepDocType;
  legalRepDocNumber: string;
  // Obligatorio — si es true, la cuenta pasa a revisión manual de
  // cumplimiento justo al completar este paso (ver LegalIdentificationResult).
  legalRepPepDeclaration: boolean;
  annualIncomeRange?: AnnualIncomeRange;
  economicActivityDescription: string;
  ciiuCode?: string;
  address: string;
  municipalityCode?: string;
}

// El backend corre el screening SAGRILAFT en este paso; si la declaración PEP
// es true (o el screening exige revisión), la cuenta queda en revisión manual
// en vez de avanzar al diagnóstico — de ahí los campos opcionales `underReview`
// / `status` sobre el shape normal de OnboardingStatus.
export interface LegalIdentificationResult extends Partial<OnboardingStatus> {
  underReview?: boolean;
  status?: string;
}

export type PrimaryGoal = "VENDER" | "PUBLICIDAD" | "AMBAS";
export type TechIntegrationNeed = "API" | "CONCILIACION" | "ACTIVACION_AUTOMATICA";

export interface DiagnosticRequest {
  techIntegrationNeeds: TechIntegrationNeed[];
  // Requerido si techIntegrationNeeds no viene vacío — describe la necesidad
  // técnica (máx. 1000 caracteres). En ese caso el backend calcula Ruta D
  // directo y el resto de los campos de abajo no aplican ni se envían.
  integrationDetails?: string;
  primaryGoal?: PrimaryGoal;
  wantsFixedFee?: boolean;
  requiresCustomGames?: boolean;
  regulatedSector?: boolean;
  requiresSpecialNegotiation?: boolean;
}

// ── Plan (pasos 6-7) ─────────────────────────────────────────────────────────
// GET /plan devuelve el catálogo completo (BASIC/STANDARD/PREMIUM) para una
// tabla comparativa, marcando cuál es el recomendado según la ruta — el
// usuario puede aceptar cualquiera de los tres, no solo el recomendado.

export interface OnboardingPlanOption {
  planCode: PlanCode;
  planName: string;
  recommended: boolean;
  // Solo aplica a BASIC — null en STANDARD/PREMIUM.
  monthlyFeeCents: number | null;
  // Solo aplican a STANDARD/PREMIUM — null en BASIC.
  minInvestmentCents: number | null;
  maxInvestmentCents: number | null;
  saleCommissionPct: number;
  // -1 = ilimitado.
  maxKeysPct: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  canHavePets: boolean;
  // -1 = ilimitado.
  maxProducts: number;
  maxAds: number;
  maxBrandedGames: number;
  maxSurveys: number;
  visibilityBoostPct: number;
}

export interface OnboardingPlanCatalog {
  recommendedPlanCode: PlanCode;
  // Ruta D/E — mostrar aviso de contactar asesor sin importar el plan elegido.
  requiresAdvisorContact: boolean;
  // A nivel raíz, no varían por plan.
  taxNote: string;
  liquidationConditions: string;
  plans: OnboardingPlanOption[];
}

export interface AcceptPlanRequest {
  planCode: PlanCode;
  // Requerido para STANDARD/PREMIUM (debe caer dentro de min/maxInvestmentCents
  // del plan elegido, 422 si no) — no aplica para BASIC.
  investmentAmountCents?: number;
  // Requerido solo para BASIC — no hay plazo fijo en STANDARD/PREMIUM porque
  // el monto invertido se consume vía comisión al ritmo de las ventas, no por
  // período. El backend lo ignora si se envía para esos dos planes.
  contractDurationMonths?: number;
}

export interface AcceptedPlanSummary {
  planCode: PlanCode;
  // El monto aceptado — null para BASIC.
  investmentAmountCents: number | null;
  // La duración aceptada — null para STANDARD/PREMIUM.
  contractDurationMonths: number | null;
}

// ── Documentos (paso 8) ──────────────────────────────────────────────────────

export type OnboardingDocumentType =
  | "RUT"
  | "CAMARA_COMERCIO"
  | "CEDULA_REPRESENTANTE"
  | "CERTIFICACION_BANCARIA"
  | "PERMISO_SECTORIAL"
  | "MARCA_REGISTRADA"
  | "OTRO";

export interface OnboardingDocument {
  id: number;
  documentType: OnboardingDocumentType;
  originalFileName: string;
  sizeBytes: number;
  status: string;
  uploadedAt: string;
  downloadUrl: string | null;
}

export interface DocumentChecklistItem {
  documentType: OnboardingDocumentType;
  required: boolean;
  uploaded: boolean;
}

export interface OnboardingDocumentsResponse {
  documents: OnboardingDocument[];
  checklist: DocumentChecklistItem[];
  allRequiredUploaded: boolean;
}

export interface PrepareDocumentUploadRequest {
  documentType: OnboardingDocumentType;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PrepareDocumentUploadResponse {
  documentId: number;
  permission: {
    uploadUrl: string;
    expiresInSeconds: number;
  };
}

// ── Resumen previo a generar el contrato ────────────────────────────────────
// Solo lectura — cada bloque viene null si ese paso todavía no se completó
// (excepto `documents`, que siempre viene presente, con listas vacías si no
// hay nada cargado). No reemplaza la vista/descarga del PDF ya generado
// (OnboardingContract) — es previo a que exista un PDF.

export interface OnboardingSummaryLegalIdentification {
  personType: PersonType;
  companyName: string | null;
  nit: string;
  mercantileRegistration: string | null;
  legalRepFirstName: string;
  legalRepLastName: string;
  legalRepDocType: LegalRepDocType;
  legalRepDocNumber: string;
  legalRepPepDeclaration: boolean;
  annualIncomeRange: AnnualIncomeRange | null;
  ciiuCode: string | null;
  economicActivityDescription: string;
  address: string;
  municipalityName: string | null;
  departmentName: string | null;
}

export interface OnboardingSummaryDiagnostic {
  techIntegrationNeeds: TechIntegrationNeed[];
  integrationDetails: string | null;
  // Ruta D (techIntegrationNeeds no vacío) — el resto de las preguntas no se
  // pidieron, así que llegan en null.
  primaryGoal: PrimaryGoal | null;
  wantsFixedFee: boolean | null;
  requiresCustomGames: boolean | null;
  regulatedSector: boolean | null;
  requiresSpecialNegotiation: boolean | null;
}

export interface OnboardingSummaryClassification {
  route: OnboardingRoute;
  routeName: string;
  explanation: string;
  confirmed: boolean;
}

export interface OnboardingSummaryPlan {
  planCode: PlanCode;
  planName: string;
  description: string;
  monthlyFeeCents: number | null;
  minInvestmentCents: number | null;
  maxInvestmentCents: number | null;
  investmentAmountCents: number | null;
  saleCommissionPct: number;
  maxKeysPct: number;
  taxNote: string;
  liquidationConditions: string;
  requiresAdvisorContact: boolean;
  accepted: boolean;
  acceptedAt: string | null;
  // Solo aplica a BASIC — null en STANDARD/PREMIUM y en BASIC antes de aceptar.
  contractDurationMonths: number | null;
}

export interface OnboardingSummary {
  termsVersion: string | null;
  termsAcceptedAt: string | null;
  legalIdentification: OnboardingSummaryLegalIdentification | null;
  diagnostic: OnboardingSummaryDiagnostic | null;
  classification: OnboardingSummaryClassification | null;
  plan: OnboardingSummaryPlan | null;
  documents: OnboardingDocumentsResponse;
}

// ── Contrato (pasos 9-10, lado comercio) ────────────────────────────────────

export interface OnboardingContract {
  contractId: number;
  version: number;
  status: ContractStatus;
  generatedAt: string;
  // URL firmada, expira en ~5 min — pedirla de nuevo si expira, no guardarla.
  downloadUrl: string;
  businessApprovedAt: string | null;
  veryganaReviewedAt: string | null;
  veryganaDecisionNotes: string | null;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: Record<string, string>;
}

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const DOCUMENT_TYPE_LABELS: Record<OnboardingDocumentType, string> = {
  RUT: "RUT",
  CAMARA_COMERCIO: "Cámara de Comercio",
  CEDULA_REPRESENTANTE: "Cédula del representante legal",
  CERTIFICACION_BANCARIA: "Certificación bancaria",
  PERMISO_SECTORIAL: "Permiso sectorial",
  MARCA_REGISTRADA: "Marca registrada",
  OTRO: "Otro documento",
};

// ── Service ──────────────────────────────────────────────────────────────────

const BASE = "/commercials/onboarding";

export const OnboardingService = {
  async getStatus(): Promise<OnboardingStatus> {
    const response = await apiClient.get(`${BASE}/status`);
    return response.data;
  },

  async acceptTerms(data: TermsAcceptRequest): Promise<OnboardingStatus> {
    const response = await apiClient.post(`${BASE}/terms`, data);
    return response.data;
  },

  async submitLegalIdentification(data: LegalIdentificationRequest): Promise<LegalIdentificationResult> {
    const response = await apiClient.post(`${BASE}/legal-identification`, data);
    return response.data;
  },

  async submitDiagnostic(data: DiagnosticRequest): Promise<ClassificationResult> {
    const response = await apiClient.post(`${BASE}/diagnostic`, data);
    return response.data;
  },

  async getClassification(): Promise<ClassificationResult> {
    const response = await apiClient.get(`${BASE}/classification`);
    return response.data;
  },

  async confirmClassification(): Promise<OnboardingStatus> {
    const response = await apiClient.post(`${BASE}/classification/confirm`);
    return response.data;
  },

  // ── Plan (pasos 6-7) ─────────────────────────────────────────────────────

  async getPlan(): Promise<OnboardingPlanCatalog> {
    const response = await apiClient.get(`${BASE}/plan`);
    return response.data;
  },

  async acceptPlan(data: AcceptPlanRequest): Promise<AcceptedPlanSummary> {
    const response = await apiClient.post(`${BASE}/plan/accept`, data);
    return response.data;
  },

  // ── Documentos (paso 8) ──────────────────────────────────────────────────

  async getDocuments(): Promise<OnboardingDocumentsResponse> {
    const response = await apiClient.get(`${BASE}/documents`);
    return response.data;
  },

  async prepareDocumentUpload(data: PrepareDocumentUploadRequest): Promise<PrepareDocumentUploadResponse> {
    const response = await apiClient.post(`${BASE}/documents/prepare-upload`, data);
    return response.data;
  },

  async uploadDocumentFile(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error(`Error al subir el archivo (${res.status})`);
  },

  async confirmDocumentUpload(documentId: number): Promise<OnboardingDocumentsResponse> {
    const response = await apiClient.post(`${BASE}/documents/${documentId}/confirm`);
    return response.data;
  },

  async discardDocument(documentId: number): Promise<OnboardingDocumentsResponse> {
    const response = await apiClient.post(`${BASE}/documents/${documentId}/discard`);
    return response.data;
  },

  // Paso explícito para avanzar tras completar la carga documental — subir o
  // confirmar el último documento requerido ya NO avanza el paso solo, hay
  // que llamar esto (habilitado solo cuando allRequiredUploaded === true).
  async continueDocuments(): Promise<OnboardingDocumentsResponse> {
    const response = await apiClient.post(`${BASE}/documents/continue`);
    return response.data;
  },

  // Resumen de solo lectura para revisar antes de generar el PDF real.
  async getSummary(): Promise<OnboardingSummary> {
    const response = await apiClient.get(`${BASE}/summary`);
    return response.data;
  },

  // ── Contrato (pasos 9-10) ────────────────────────────────────────────────

  async generateContract(): Promise<OnboardingContract> {
    const response = await apiClient.post(`${BASE}/contract/generate`);
    return response.data;
  },

  async getContract(): Promise<OnboardingContract> {
    const response = await apiClient.get(`${BASE}/contract`);
    return response.data;
  },

  async approveContract(): Promise<OnboardingContract> {
    const response = await apiClient.post(`${BASE}/contract/approve`);
    return response.data;
  },

  // Devuelve directamente el OnboardingStep al que hay que volver (ej.
  // "PLAN_PENDING") — no un OnboardingStatus completo, así que no hace falta
  // un GET /status aparte para saber a dónde redirigir.
  async requestContractChanges(): Promise<OnboardingStep> {
    const response = await apiClient.post(`${BASE}/contract/request-changes`);
    return response.data;
  },
};

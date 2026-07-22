import apiClient from "@/lib/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export type LegalDocumentType =
  | "USERS_TERMS_AND_CONDITIONS"
  | "BUSINESS_OWNER_TERMS_AND_CONDITIONS"
  | "BASIC_PLAN_CONTRACT"
  | "STANDARD_PLAN_CONTRACT"
  | "PREMIUM_PLAN_CONTRACT"
  | "PRIVACY_POLICY"
  | "DATA_PROCESSING_POLICY"
  | "COOKIES_POLICY";

export interface LegalDocument {
  id: number;
  type: LegalDocumentType;
  version: string;
  documentUrl: string;
  status: string;
  publishedDate: string;
  active: boolean;
}

export const LEGAL_DOCUMENT_TYPES: LegalDocumentType[] = [
  "USERS_TERMS_AND_CONDITIONS",
  "BUSINESS_OWNER_TERMS_AND_CONDITIONS",
  "BASIC_PLAN_CONTRACT",
  "STANDARD_PLAN_CONTRACT",
  "PREMIUM_PLAN_CONTRACT",
  "PRIVACY_POLICY",
  "DATA_PROCESSING_POLICY",
  "COOKIES_POLICY",
];

export const LEGAL_DOCUMENT_TYPE_LABELS: Record<LegalDocumentType, string> = {
  USERS_TERMS_AND_CONDITIONS: "Términos y Condiciones para Usuarios",
  BUSINESS_OWNER_TERMS_AND_CONDITIONS: "Términos y Condiciones para Empresarios / Comerciantes",
  BASIC_PLAN_CONTRACT: "Contrato Plan Básico",
  STANDARD_PLAN_CONTRACT: "Contrato Plan Estándar",
  PREMIUM_PLAN_CONTRACT: "Contrato Plan Premium",
  PRIVACY_POLICY: "Política de Privacidad",
  DATA_PROCESSING_POLICY: "Política de Tratamiento de Datos",
  COOKIES_POLICY: "Política de Cookies",
};

// ── Service ──────────────────────────────────────────────────────────────────
// Endpoints públicos — no requieren Authorization. Sirven para mostrar
// versión/fecha/enlace de descarga de T&C, Privacidad, Tratamiento de Datos
// y Cookies en cualquier pantalla (onboarding, registro, footer), sin sesión.

export const LegalDocumentsService = {
  async getAll(): Promise<LegalDocument[]> {
    const response = await apiClient.get("/legal-documents");
    return response.data;
  },

  async getByType(type: LegalDocumentType): Promise<LegalDocument> {
    const response = await apiClient.get(`/legal-documents/${type}`);
    return response.data;
  },
};

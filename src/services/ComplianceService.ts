import apiClient from "@/lib/api/client";
import type { ContractStatus, OnboardingDocument, OnboardingRoute } from "@/services/commercial/OnboardingService";

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

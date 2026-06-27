import apiClient from "@/lib/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface KycPendingEntry {
  id: number;
  name: string;
  lastName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  isPep: boolean;
  registeredAt: string;
}

export interface ScreeningHit {
  id: number;
  queriedName: string;
  documentNumber: string;
  listName: string;
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

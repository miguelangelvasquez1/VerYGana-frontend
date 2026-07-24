import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";

// ── Types ────────────────────────────────────────────────────────────────────
// /admin/audit-logs complementa a /admin/security-events: expone todo lo demás
// que sea WARNING/CRITICAL, excluyendo siempre category=SECURITY (sin solapamiento
// entre los dos endpoints).

export type AdminAuditLogLevel = "WARNING" | "CRITICAL";

export interface AdminAuditLogEvent {
  id: number;
  userId: number | null;
  username: string;
  userEmail: string | null;
  action: string;
  level: AdminAuditLogLevel;
  category: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  success: boolean;
  additionalData: Record<string, unknown> | null;
}

export interface AdminAuditLogFilters {
  action?: string;
  category?: string;
  level?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// El resumen (conteo por action) se calcula con los mismos filtros de la
// búsqueda, igual que en /admin/security-events — viene junto con la lista.
export interface AdminAuditLogsResult {
  events: PagedResponse<AdminAuditLogEvent>;
  summary: Record<string, number>;
}

// ── API ──────────────────────────────────────────────────────────────────────

export const getAdminAuditLogs = async (
  filters: AdminAuditLogFilters
): Promise<AdminAuditLogsResult> => {
  const { page = 0, size = 50, ...rest } = filters;
  const params: Record<string, unknown> = { page, size };
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params[k] = v;
  });
  const res = await apiClient.get("/admin/audit-logs", { params });
  return res.data;
};

export const getCriticalAdminAuditLogs = async (
  category?: string,
  from?: string,
  to?: string,
  page = 0,
  size = 50,
  sort?: string
): Promise<AdminAuditLogsResult> => {
  const params: Record<string, unknown> = { page, size };
  if (category) params.category = category;
  if (from) params.from = from;
  if (to) params.to = to;
  if (sort) params.sort = sort;
  const res = await apiClient.get("/admin/audit-logs/critical", { params });
  return res.data;
};

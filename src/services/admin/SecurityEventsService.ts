import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";

// ── Types ────────────────────────────────────────────────────────────────────

export type SecurityEventLevel = "INFO" | "WARNING" | "CRITICAL" | "DEBUG";

export type SecurityEventAction =
  | "BRUTE_FORCE_ATTEMPT"
  | "TOKEN_FARMING"
  | "SESSION_HIJACKING_SUSPECTED"
  | "IP_AUTO_BLOCKED"
  | "EXCESSIVE_SESSIONS"
  | "TOKEN_CLEANUP_FAILED"
  | "MONTHLY_CLEANUP_FAILED"
  | "HEALTH_CHECK_FAILED";

export interface SecurityEvent {
  id: number;
  username: string;
  action: SecurityEventAction | string;
  level: SecurityEventLevel;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  success: boolean;
  additionalData: Record<string, unknown> | null;
}

export interface SecurityEventFilters {
  action?: string;
  level?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export type SecurityEventsSummary = Record<string, number>;

// El resumen (conteo por tipo) se calcula con los mismos filtros de la búsqueda,
// no una ventana fija — por eso viene junto con la lista en una sola respuesta.
export interface SecurityEventsResult {
  events: PagedResponse<SecurityEvent>;
  summary: SecurityEventsSummary;
}

// ── API ──────────────────────────────────────────────────────────────────────

export const getSecurityEvents = async (
  filters: SecurityEventFilters
): Promise<SecurityEventsResult> => {
  const { page = 0, size = 50, ...rest } = filters;
  const params: Record<string, unknown> = { page, size };
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params[k] = v;
  });
  const res = await apiClient.get("/admin/security-events", { params });
  return res.data;
};

export const getCriticalSecurityEvents = async (
  from?: string,
  to?: string,
  page = 0,
  size = 50,
  sort?: string
): Promise<SecurityEventsResult> => {
  const params: Record<string, unknown> = { page, size };
  if (from) params.from = from;
  if (to) params.to = to;
  if (sort) params.sort = sort;
  const res = await apiClient.get("/admin/security-events/critical", { params });
  return res.data;
};

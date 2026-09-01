import apiClient from "@/lib/api/client";
import {
  CommercialDashboardSummary,
  DashboardPeriodType,
} from "@/types/commercial/Dashboard.types";

// Opciones del selector de periodo del panel. `default` del backend es
// LAST_30_DAYS si no se envía el query param.
export const DASHBOARD_PERIOD_OPTIONS: {
  value: DashboardPeriodType;
  label: string;
}[] = [
  { value: "TODAY", label: "Hoy" },
  { value: "LAST_7_DAYS", label: "7 días" },
  { value: "LAST_30_DAYS", label: "30 días" },
  { value: "THIS_MONTH", label: "Este mes" },
];

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriodType = "LAST_30_DAYS";

// GET /commercial/dashboard/summary?period=<PERIODO>
// Auth: rol COMMERCIAL (mismo esquema que el resto de /commercial/*).
export const getCommercialDashboardSummary = async (
  period: DashboardPeriodType = DEFAULT_DASHBOARD_PERIOD,
): Promise<CommercialDashboardSummary> => {
  const response = await apiClient.get<CommercialDashboardSummary>(
    "/commercial/dashboard/summary",
    { params: { period } },
  );
  return response.data;
};

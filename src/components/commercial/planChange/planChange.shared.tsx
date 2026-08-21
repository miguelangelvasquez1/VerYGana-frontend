import { PlanCode } from "@/types/finance/plans/Plan.types";

export const PLANCHANGE_TOPUP_REFERENCE_KEY = "vg_planchange_topup_reference";
// El downloadUrl del otrosí solo viaja en la respuesta de creación
// (POST /plans/change-request) — GET /current no lo trae. Se guarda de
// forma efímera para que PlanChangeWizard lo muestre justo después de
// crear la solicitud desde /plans.
export const PLANCHANGE_CONTRACT_DOWNLOAD_URL_KEY = "vg_planchange_contract_download_url";

export type FieldErrors = Record<string, string>;

export function extractApiError(err: unknown): { message: string; details: FieldErrors } {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  return {
    message: data?.message || "Ocurrió un error. Intenta de nuevo.",
    details: (data?.details && typeof data.details === "object" ? data.details : {}) as FieldErrors,
  };
}

export const PLAN_CHANGE_LABELS: Record<PlanCode, string> = {
  [PlanCode.BASIC]: "Personal",
  [PlanCode.STANDARD]: "Estándar",
  [PlanCode.PREMIUM]: "Premium",
};

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import { PlanChangeRequestResponseDTO } from "@/types/finance/plans/PlanChange.types";
import { getCurrentPlanChangeRequest } from "@/services/planChangeService";

export const PLANCHANGE_TOPUP_REFERENCE_KEY = "vg_planchange_topup_reference";

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

// Usado para detectar, desde otro flujo (ej. recarga), si ya existe una
// solicitud de cambio de plan en curso que bloquea la nueva acción. Solo los
// estados vivos (REQUESTED, CONTRACT_PENDING_REVIEW, CONTRACT_SIGNED,
// PAYMENT_PENDING) cuentan: un REJECTED que /current todavía devuelve (rechazo
// sin dar por leído) no bloquea recargas ni una solicitud nueva.
export function isActivePlanChangeRequest(
  request: PlanChangeRequestResponseDTO | null | undefined
): request is PlanChangeRequestResponseDTO {
  return !!request && request.status !== "APPLIED" && request.status !== "REJECTED" && request.status !== "CANCELLED";
}

// Decide a dónde llevar al comercial cuando pulsa "Cambiar de plan":
// si ya tiene una solicitud de cambio de plan registrada, lo llevamos al
// detalle en /commercial/plan-change; si no, al catálogo de planes en
// /plans. Si la consulta falla, caemos al catálogo para no bloquearlo.
export async function resolvePlanChangeDestination(): Promise<string> {
  try {
    const current = await getCurrentPlanChangeRequest();
    if (current) return "/commercial/plan-change";
  } catch {
    /* consulta fallida — mostramos los planes normalmente */
  }
  return "/plans";
}

// Botón "Cambiar de plan" con el comportamiento de arriba. Se usa en
// /balance y en /commercial/profile.
export function ChangePlanButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      router.push(await resolvePlanChangeDestination());
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-[#03548C]/25 text-[#03548C] font-bold text-sm rounded-xl shadow-sm hover:bg-[#03548C]/5 hover:border-[#03548C]/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      }
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
      Cambiar de plan
    </button>
  );
}

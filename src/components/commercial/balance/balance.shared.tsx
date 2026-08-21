import React from "react";
import { PlanCode } from "@/types/finance/plans/Plan.types";

// sessionStorage — permite recuperar el flujo si el usuario recarga la
// página a mitad de camino, y marca "salí a pagar a Wompi" para que el
// wizard sepa que debe auto-verificar el estado al volver.
export const RECHARGE_CONTRACT_ID_KEY = "vg_recharge_contract_id";
export const RECHARGE_PAYMENT_REFERENCE_KEY = "vg_recharge_payment_reference";

// Mismo rango usado en /plans (src/app/plans/page.tsx) — solo valida en
// cliente para dar feedback rápido, el backend es la fuente de verdad.
export const RECHARGE_RANGES: Partial<Record<PlanCode, { min: number; max: number | null }>> = {
  [PlanCode.STANDARD]: { min: 1_000_000, max: 9_999_999 },
  [PlanCode.PREMIUM]: { min: 10_000_000, max: null },
};

export type FieldErrors = Record<string, string>;

export function extractApiError(err: unknown): { message: string; details: FieldErrors } {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  return {
    message: data?.message || "Ocurrió un error. Intenta de nuevo.",
    details: (data?.details && typeof data.details === "object" ? data.details : {}) as FieldErrors,
  };
}

export function WizardActionButton({
  submitting,
  onClick,
  disabled,
  label,
}: {
  submitting: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting || disabled}
      className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer
        ${
          submitting || disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#03548C] hover:bg-[#0b1440] active:scale-[0.98] text-white"
        }`}
    >
      {submitting ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Procesando...
        </span>
      ) : (
        label
      )}
    </button>
  );
}

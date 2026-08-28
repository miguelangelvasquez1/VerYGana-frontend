"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import { ContractSummaryResponseDTO } from "@/types/finance/plans/Contract.types";

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

// Usado para detectar, desde otro flujo (ej. cambio de plan), si el
// contrato de recarga guardado en sessionStorage todavía puede bloquear la
// nueva acción. REJECTED/CANCELLED son los únicos estados definitivamente
// no cancelables; el resto se intenta cancelar y el backend responde 422
// si ya se generó el checkout de pago.
export function isActiveRechargeContract(
  contract: ContractSummaryResponseDTO | null | undefined
): contract is ContractSummaryResponseDTO {
  return !!contract && contract.status !== "REJECTED" && contract.status !== "CANCELLED";
}

export type FieldErrors = Record<string, string>;

export function extractApiError(err: unknown): { message: string; details: FieldErrors } {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  return {
    message: data?.message || "Ocurrió un error. Intenta de nuevo.",
    details: (data?.details && typeof data.details === "object" ? data.details : {}) as FieldErrors,
  };
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
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
          <Spinner />
          Procesando...
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// Modal de confirmación con la estética del panel del comercial (tarjeta
// blanca redondeada, ícono en pastilla, botón primario ancho + enlace
// secundario), en vez del ConfirmDialog genérico de admin.
type ConfirmTone = "primary" | "danger" | "warning";

const CONFIRM_TONES: Record<
  ConfirmTone,
  { iconWrap: string; icon: React.ReactNode; button: string }
> = {
  primary: {
    iconWrap: "bg-[#03548C]/10",
    icon: <HelpCircle className="w-7 h-7 text-[#03548C]" />,
    button: "bg-[#03548C] hover:bg-[#0b1440] active:scale-[0.98] text-white",
  },
  danger: {
    iconWrap: "bg-red-100",
    icon: <AlertTriangle className="w-7 h-7 text-red-500" />,
    button: "bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white",
  },
  warning: {
    iconWrap: "bg-amber-100",
    icon: <Info className="w-7 h-7 text-amber-500" />,
    button: "bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white",
  },
};

export function WizardConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) setLoading(false);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  const t = CONFIRM_TONES[tone];

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0b1440]/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 sm:p-7 text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${t.iconWrap}`}>
          {t.icon}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 leading-relaxed">{description}</p>}
        </div>
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer
              disabled:cursor-not-allowed ${loading ? "bg-gray-200 text-gray-400" : t.button}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Procesando...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

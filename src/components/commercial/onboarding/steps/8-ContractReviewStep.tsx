import React, { useState } from "react";
import { AlertTriangle, FileText, Loader2, Phone } from "lucide-react";
import type { OnboardingContract } from "@/services/commercial/OnboardingService";
import { StepButton } from "../onboarding.shared";

interface Props {
  contract: OnboardingContract;
  submitting: boolean;
  onOpenContract: () => Promise<void>;
  onApprove: () => void;
}

export function ContractReviewStep({ contract, submitting, onOpenContract, onApprove }: Props) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      await onOpenContract();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Revisa tu contrato</h3>
        <p className="text-sm text-gray-500">
          Versión {contract.version} — generado el{" "}
          {new Date(contract.generatedAt).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Este documento es una plantilla base, pendiente de validación jurídica por el equipo
          legal de VerYGana. Revisa las condiciones antes de aprobarlo.
        </p>
      </div>

      <button
        type="button"
        onClick={handleOpen}
        disabled={opening}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#03548C]/30 text-[#03548C] font-semibold text-sm hover:bg-[#03548C]/5 transition disabled:opacity-50 cursor-pointer"
      >
        {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Ver contrato
      </button>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Phone className="w-5 h-5 text-[#03548C] shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Si tienes alguna objeción con el contrato, comunícate con nuestro servicio al cliente
          para resolverla antes de aprobarlo.
        </p>
      </div>

      <StepButton submitting={submitting} onClick={onApprove} label="Aprobar contrato" />
    </div>
  );
}

import React from "react";
import { Sparkles } from "lucide-react";
import type { ClassificationResult } from "@/services/commercial/OnboardingService";
import { StepButton } from "../onboarding.shared";

interface Props {
  classification: ClassificationResult;
  submitting: boolean;
  onConfirm: () => void;
}

export function ClassificationStep({ classification, submitting, onConfirm }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Tu ruta comercial</h3>
        <p className="text-sm text-gray-500">
          Con base en tus respuestas, te asignamos la siguiente ruta comercial en VerYGana.
        </p>
      </div>

      <div className="flex items-start gap-4 p-5 bg-[#03548C]/5 border border-[#03548C]/20 rounded-xl">
        <div className="w-11 h-11 bg-[#03548C]/10 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-[#03548C]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#03548C]/70 mb-1">
            Ruta {classification.route}
          </p>
          <p className="text-base font-bold text-gray-900 mb-2">{classification.routeLabel}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{classification.explanation}</p>
        </div>
      </div>

      <StepButton submitting={submitting} onClick={onConfirm} label="Continuar" />
    </div>
  );
}

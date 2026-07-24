import React from "react";
import { AlertTriangle, ExternalLink, FileText, Loader2 } from "lucide-react";
import type { LegalDocument } from "@/services/LegalDocumentsService";
import { StepButton } from "../onboarding.shared";

interface Props {
  document: LegalDocument | null;
  loadError: boolean;
  onRetry: () => void;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  submitting: boolean;
  error?: string;
  onNext: () => void;
}

export function TermsStep({
  document,
  loadError,
  onRetry,
  accepted,
  onAcceptedChange,
  submitting,
  error,
  onNext,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Términos y Condiciones</h3>
        <p className="text-sm text-gray-500">
          Antes de continuar, revisa y acepta los términos y condiciones para comerciantes de VerYGana.
        </p>
      </div>

      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <p className="text-sm text-gray-600">No pudimos cargar los términos y condiciones.</p>
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-[#03548C] hover:underline font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : !document ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          <a
            href={document.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#03548C]/40 hover:bg-[#03548C]/5 transition group"
          >
            <div className="w-11 h-11 bg-[#03548C]/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#03548C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-[#03548C] transition">
                Términos y Condiciones — versión {document.version}
              </p>
              <p className="text-xs text-gray-500">
                Publicado el{" "}
                {new Date(document.publishedDate).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#03548C] transition shrink-0" />
          </a>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => onAcceptedChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#03548C] focus:ring-[#03548C]/40 shrink-0"
            />
            <span className="text-sm text-gray-700 leading-snug">
              He leído y acepto los Términos y Condiciones para comerciantes de VerYGana.
            </span>
          </label>

          <StepButton submitting={submitting} disabled={!accepted} onClick={onNext} />
        </>
      )}
    </div>
  );
}

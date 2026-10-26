'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface RejectSurveyModalProps {
  surveyTitle: string;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectSurveyModal: React.FC<RejectSurveyModalProps> = ({
  surveyTitle,
  reason,
  isSubmitting,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Rechazar encuesta</h3>
        <p className="text-gray-600 mb-4">
          Proporciona una razón clara para rechazar &quot;{surveyTitle}&quot;. El presupuesto completo se
          devolverá a la wallet del comercial.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          rows={4}
          placeholder="Ej: El contenido de las preguntas no cumple con nuestras políticas..."
          required
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="cursor-pointer flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="cursor-pointer flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  );
};

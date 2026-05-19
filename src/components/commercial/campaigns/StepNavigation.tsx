'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  onCancel?: () => void;
  backLabel?: string;
  continueLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Si true, el botón continuar actúa como submit del form */
  isSubmit?: boolean;
  /** Si true, muestra ícono de check en lugar de flecha (último paso) */
  isFinalStep?: boolean;
  /** Deshabilita el botón de continuar */
  disableContinue?: boolean;
}

export function StepNavigation({
  onBack,
  onContinue,
  onCancel,
  backLabel = 'Volver',
  continueLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  loading = false,
  isSubmit = false,
  isFinalStep = false,
  disableContinue = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      {/* Izquierda: Cancelar o Volver */}
      <div className="flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg 
                       hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
        )}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 
                       border border-gray-300 rounded-lg hover:bg-gray-50 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        )}
      </div>

      {/* Derecha: Continuar / Confirmar */}
      <button
        type={isSubmit ? 'submit' : 'button'}
        onClick={!isSubmit ? onContinue : undefined}
        disabled={loading || disableContinue}
        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white 
                   bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800
                   disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            {continueLabel}
            {isFinalStep
              ? <Check className="w-4 h-4" />
              : <ArrowRight className="w-4 h-4" />
            }
          </>
        )}
      </button>
    </div>
  );
}
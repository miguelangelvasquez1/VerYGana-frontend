'use client';

// Pantallas de estado del layout del comercial (plan que no alcanza, error al cargar el registro). Viven aparte
// para que el layout las cargue solo cuando hacen falta (RN-8 de la spec 014).

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { PlanCode } from '@/types/finance/plans/Plan.types';

const PLAN_LABELS: Record<PlanCode, string> = {
  [PlanCode.BASIC]:    'Personal',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]:  'Premium',
};

export function LockedPage({ requiredPlans }: { requiredPlans: PlanCode[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sección no disponible</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Esta funcionalidad requiere uno de los siguientes planes:
      </p>
      <div className="flex gap-2 mb-6">
        {requiredPlans.map(p => (
          <span key={p} className="px-3 py-1 bg-[#03548C]/10 text-[#03548C] text-xs font-bold rounded-full border border-[#03548C]/20">
            {PLAN_LABELS[p]}
          </span>
        ))}
      </div>
      <Link
        href="/plans"
        className="inline-flex items-center gap-2 px-5 py-2.5 max-lg:min-h-11 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Ver planes disponibles
      </Link>
    </div>
  );
}

export function OnboardingErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No pudimos cargar tu registro</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Ocurrió un error al verificar el estado de tu registro comercial. Intenta de nuevo.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 max-lg:min-h-11 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  );
}

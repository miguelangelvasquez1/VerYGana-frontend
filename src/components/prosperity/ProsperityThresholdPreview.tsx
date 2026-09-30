'use client';

import React from 'react';
import { Sprout } from 'lucide-react';
import { formatProsperityCents, formatProsperityPesos, thresholdFromNetPesos } from '@/utils/prosperity';

// Fila destacada "Umbral de Prosperidad que generarás" para recarga, cambio
// de plan y onboarding (solo STANDARD). Siempre sobre el valor NETO (sin IVA).
interface Props {
  netPesos: number;
  label?: string;
  help?: string;
  /** Saldo actual del empresario (centavos). Si viene, muestra "Tu Saldo pasará de X a Y". */
  currentBalanceCents?: number | null;
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export function ProsperityThresholdPreview({
  netPesos,
  label = 'Umbral de Prosperidad que generarás',
  help,
  currentBalanceCents,
  variant = 'light',
  compact = false,
}: Props) {
  const thresholdPesos = thresholdFromNetPesos(netPesos);
  const dark = variant === 'dark';

  return (
    <div
      className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} ${
        dark ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-2 text-sm font-semibold ${dark ? 'text-emerald-200' : 'text-emerald-900'}`}
        >
          <Sprout className={`h-4 w-4 shrink-0 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} />
          {label}
        </span>
        <span className={`whitespace-nowrap text-base font-bold ${dark ? 'text-white' : 'text-emerald-900'}`}>
          {formatProsperityPesos(thresholdPesos)}
        </span>
      </div>
      {help && (
        <p className={`mt-1.5 text-xs leading-relaxed ${dark ? 'text-emerald-100/80' : 'text-emerald-800/80'}`}>
          {help}
        </p>
      )}
      {currentBalanceCents != null && (
        <p className={`mt-1.5 text-xs ${dark ? 'text-emerald-100/80' : 'text-emerald-800/80'}`}>
          Tu Saldo pasará de {formatProsperityCents(currentBalanceCents)} a{' '}
          <span className="font-semibold">{formatProsperityCents(currentBalanceCents + thresholdPesos * 100)}</span>
        </p>
      )}
    </div>
  );
}

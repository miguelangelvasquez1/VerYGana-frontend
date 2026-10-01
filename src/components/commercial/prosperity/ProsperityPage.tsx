'use client';

import React from 'react';
import Link from 'next/link';
import { Info,Loader2, RefreshCw, Snowflake, Sprout } from 'lucide-react';
import { useProsperitySummary } from '@/hooks/prosperity/useProsperity';
import type { ProsperitySummaryResponseDTO } from '@/types/commercial/Prosperity.types';
import { formatProsperityCents, isProsperityVisible } from '@/utils/prosperity';
import {
  ProsperityDisclaimer,
  ProsperityIndicators,
  ProsperityStatusBadge,
  ProsperityThresholdsTable,
} from '@/components/prosperity/ProsperityUI';
import { ProsperityMovementsSection } from './ProsperityMovementsSection';

// ─── Banner informativo según el estado ──────────────────────────────────────

function ProsperityStatusBanner({ summary }: { summary: ProsperitySummaryResponseDTO }) {
  if (summary.status === 'FROZEN') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-amber-800">
          Tu Saldo está congelado porque tu plan actual no es Estándar. Se conserva intacto y se reactiva si vuelves
          al plan Estándar.
        </p>
      </div>
    );
  }

  if (summary.status !== 'ACTIVE') return null;

  if (summary.balanceCents > 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#03548C]" />
        <p className="text-sm leading-relaxed text-blue-900">
          Tus ventas se descuentan primero de tu Saldo de Prosperidad y esa parte no paga comisión. Cuando llegue a
          $0, tus ventas pagarán la comisión de tu plan. Cada nueva inversión suma 4 veces su valor neto (sin IVA).
        </p>
      </div>
    );
  }

  if (summary.accumulatedThresholdCents > 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
        <p className="text-sm leading-relaxed text-gray-700">
          Tu Saldo se agotó: tus ventas están pagando comisión. Una nueva inversión genera un nuevo Umbral.
        </p>
      </div>
    );
  }

  return null;
}

// ─── Página ──────────────────────────────────────────────────────────────────

export function ProsperityPage() {
  const { data: summary, isLoading, isError, refetch } = useProsperitySummary();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex h-64 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-gray-900">No pudimos cargar tu Saldo de Prosperidad</p>
        <p className="mt-1 text-sm text-gray-500">Ocurrió un error al obtener el resumen. Intenta de nuevo.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#03548C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b1440]"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!isProsperityVisible(summary.status)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Sprout className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Sección no disponible</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          El Saldo de Prosperidad aplica a los empresarios del plan Estándar.
        </p>
        <Link
          href="/commercial/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b1440]"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Encabezado */}
      <div className="rounded-2xl bg-gradient-to-br from-[#03548C] to-[#0b1440] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Sprout className="h-5 w-5 text-emerald-300" />
          <h1 className="text-lg font-semibold">Saldo de Prosperidad</h1>
          <span className="ml-1">
            <ProsperityStatusBadge status={summary.status} />
          </span>
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-white/60">Saldo actual</p>
        <p className="text-4xl font-bold tracking-tight">{formatProsperityCents(summary.balanceCents)}</p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-white/75">{summary.disclaimer}</p>
      </div>

      {/* Indicadores */}
      <ProsperityIndicators
        items={[
          { label: 'Umbral acumulado', cents: summary.accumulatedThresholdCents },
          { label: 'Ventas cubiertas sin comisión', cents: summary.totalAbsorbedCents },
          { label: 'Reintegrado por devoluciones', cents: summary.totalReintegratedCents },
        ]}
      />

      <ProsperityStatusBanner summary={summary} />

      {/* Mis Umbrales */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Mis Umbrales</h2>
        <ProsperityThresholdsTable thresholds={summary.thresholds ?? []} />
      </section>

      {/* Historial */}
      <ProsperityMovementsSection />

      {/* Pie */}
      <ProsperityDisclaimer text={summary.disclaimer} className="px-1" />
    </div>
  );
}

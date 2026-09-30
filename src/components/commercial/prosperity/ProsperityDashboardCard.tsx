'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sprout } from 'lucide-react';
import { useProsperitySummary } from '@/hooks/prosperity/useProsperity';
import { formatProsperityCents, isProsperityVisible } from '@/utils/prosperity';
import {
  ProsperityConsumptionBar,
  ProsperityDisclaimer,
  ProsperityStatusBadge,
} from '@/components/prosperity/ProsperityUI';
import { DashboardCard } from '../dashboard/home/dashboard.ui';

// Tarjeta del dashboard de inicio. Solo se muestra si status !== NOT_APPLICABLE
// (los FROZEN también la ven). Mientras carga o si falla, no ocupa espacio.
export function ProsperityDashboardCard() {
  const { data: summary } = useProsperitySummary();

  if (!summary || !isProsperityVisible(summary.status)) return null;

  return (
    <DashboardCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-50 p-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Saldo de Prosperidad</h3>
          <ProsperityStatusBadge status={summary.status} />
        </div>
        <Link
          href="/commercial/prosperity"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#03548C] hover:underline"
        >
          Ver detalle
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {formatProsperityCents(summary.balanceCents)}
      </p>

      <div className="mt-4">
        <ProsperityConsumptionBar
          balanceCents={summary.balanceCents}
          accumulatedThresholdCents={summary.accumulatedThresholdCents}
        />
      </div>

      <ProsperityDisclaimer text={summary.disclaimer} className="mt-4" />
    </DashboardCard>
  );
}

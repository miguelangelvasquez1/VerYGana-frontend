'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Plus, RefreshCw, Undo2, X } from 'lucide-react';
import {
  useAdminProsperitySummary,
  useInvalidateAdminProsperity,
} from '@/hooks/prosperity/useProsperity';
import type { ProsperityThresholdsResponse } from '@/types/commercial/Prosperity.types';
import { formatProsperityCents } from '@/utils/prosperity';
import {
  ProsperityDisclaimer,
  ProsperityIndicators,
  ProsperityStatusBadge,
  ProsperityThresholdsTable,
} from '@/components/prosperity/ProsperityUI';
import { ProsperityLedgerTable } from './ProsperityLedgerTable';
import { ReverseThresholdModal } from './ReverseThresholdModal';
import { AdjustmentModal } from './AdjustmentModal';

interface Props {
  publicId: string;
}

// Pestaña "Prosperidad" del detalle de un empresario en el admin.
export function AdminProsperityTab({ publicId }: Props) {
  const { data: summary, isLoading, isError, refetch } = useAdminProsperitySummary(publicId);
  const invalidate = useInvalidateAdminProsperity();

  const [ledgerPage, setLedgerPage] = useState(0);
  const [reversing, setReversing] = useState<ProsperityThresholdsResponse | null>(null);
  // null = cerrado; { relatedEntryId } = abierto (con o sin asiento relacionado).
  const [adjusting, setAdjusting] = useState<{ relatedEntryId: number | null } | null>(null);
  // Alerta persistente tras una reversión con parte no cubierta.
  const [uncoveredAlert, setUncoveredAlert] = useState<string | null>(null);

  const reload = () => {
    setLedgerPage(0);
    invalidate(publicId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-admin-blue" size={32} />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-red-600">No se pudo cargar el Saldo de Prosperidad de este empresario.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-admin-blue/10 px-4 py-2 text-sm font-medium text-admin-blue hover:bg-admin-blue/20"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (summary.status === 'NOT_APPLICABLE') {
    return <p className="py-12 text-center text-sm text-gray-500">Este empresario no tiene Saldo de Prosperidad.</p>;
  }

  return (
    <div className="space-y-5">
      {uncoveredAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="flex-1 text-sm leading-relaxed text-red-800">{uncoveredAlert}</p>
          <button
            type="button"
            onClick={() => setUncoveredAlert(null)}
            aria-label="Descartar alerta"
            className="cursor-pointer text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Saldo de Prosperidad</p>
            <ProsperityStatusBadge status={summary.status} />
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {formatProsperityCents(summary.balanceCents)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdjusting({ relatedEntryId: null })}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-admin-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Registrar ajuste
        </button>
      </div>

      <ProsperityIndicators
        items={[
          { label: 'Umbral acumulado', cents: summary.accumulatedThresholdCents },
          { label: 'Absorbido en ventas', cents: summary.totalAbsorbedCents },
          { label: 'Reintegrado por devoluciones', cents: summary.totalReintegratedCents },
        ]}
      />

      <ProsperityDisclaimer text={summary.disclaimer} />

      {/* Umbrales */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Umbrales</h4>
        <ProsperityThresholdsTable
          thresholds={summary.thresholds ?? []}
          emptyMessage="Este empresario aún no tiene Umbrales."
          renderActions={(t) =>
            // Un Umbral solo se revierte una vez (el backend responde 409 si se repite).
            t.reversed ? null : (
              <button
                type="button"
                onClick={() => setReversing(t)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Undo2 className="h-3.5 w-3.5" /> Revertir
              </button>
            )
          }
        />
      </section>

      {/* Libro Mayor */}
      <ProsperityLedgerTable
        publicId={publicId}
        page={ledgerPage}
        onPageChange={setLedgerPage}
        onAdjustEntry={(entryId) => setAdjusting({ relatedEntryId: entryId })}
      />

      {reversing && (
        <ReverseThresholdModal
          threshold={reversing}
          balanceCents={summary.balanceCents}
          onClose={() => setReversing(null)}
          onReversed={(movement) => {
            setReversing(null);
            const uncovered = movement.uncoveredCents ?? 0;
            if (uncovered > 0) {
              setUncoveredAlert(
                `Se retiraron ${formatProsperityCents(movement.amountCents)}. ${formatProsperityCents(uncovered)} de este Umbral ya se habían usado en ventas y no se pudieron retirar; requieren tratamiento contractual.`,
              );
            } else {
              toast.success(`Umbral revertido: se retiraron ${formatProsperityCents(movement.amountCents)}.`);
            }
            reload();
          }}
          onAlreadyReversed={(message) => {
            setReversing(null);
            toast.error(message);
            reload();
          }}
        />
      )}

      {adjusting && (
        <AdjustmentModal
          publicId={publicId}
          balanceCents={summary.balanceCents}
          relatedEntryId={adjusting.relatedEntryId}
          onClose={() => setAdjusting(null)}
          onAdjusted={() => {
            setAdjusting(null);
            toast.success('Ajuste registrado');
            reload();
          }}
        />
      )}
    </div>
  );
}

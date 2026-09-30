'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, History, Loader2, RefreshCw, X } from 'lucide-react';
import { useProsperityMovements } from '@/hooks/prosperity/useProsperity';
import type { ProsperityMovementResponseDTO } from '@/types/commercial/Prosperity.types';
import {
  describeMovement,
  formatProsperityCents,
  formatProsperityDateTime,
  formatSignedMovement,
  getMovementTypeMeta,
} from '@/utils/prosperity';
import { ProsperityPagination, Th } from '@/components/prosperity/ProsperityUI';

// Créditos en verde; débitos en color neutro (consumir el Saldo es lo normal).
const amountClass = (type: string) =>
  getMovementTypeMeta(type).credit ? 'text-green-600' : 'text-gray-700';

export function ProsperityMovementsSection() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ProsperityMovementResponseDTO | null>(null);
  const { data, isLoading, isError, isFetching, refetch } = useProsperityMovements(page);

  const movements = data?.data ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-2">
            <History className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Historial de movimientos</h2>
            <p className="text-xs text-gray-500">Del más reciente al más antiguo</p>
          </div>
        </div>
        {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : isError ? (
        <div className="m-5 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            No pudimos cargar tu historial de movimientos.
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      ) : movements.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Todavía no hay movimientos.</p>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <Th>Fecha</Th>
                  <Th>Concepto</Th>
                  <Th align="right">Valor</Th>
                  <Th align="right">Saldo antes</Th>
                  <Th align="right">Saldo después</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map((m) => {
                  const subtitle = describeMovement(m);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/80"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {formatProsperityDateTime(m.effectiveAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{getMovementTypeMeta(m.type).label}</p>
                        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${amountClass(m.type)}`}>
                        {formatSignedMovement(m)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">
                        {formatProsperityCents(m.balanceBeforeCents)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                        {formatProsperityCents(m.balanceAfterCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {movements.map((m) => {
              const subtitle = describeMovement(m);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{getMovementTypeMeta(m.type).label}</p>
                        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${amountClass(m.type)}`}>
                        {formatSignedMovement(m)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-gray-400">
                      <span>{formatProsperityDateTime(m.effectiveAt)}</span>
                      <span>
                        {formatProsperityCents(m.balanceBeforeCents)} → {formatProsperityCents(m.balanceAfterCents)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {data && <ProsperityPagination meta={data.meta} onPageChange={setPage} loading={isFetching} />}
        </>
      )}

      <MovementDetailDrawer movement={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

// ─── Panel lateral con el detalle del movimiento ─────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-900 break-words">{value}</dd>
    </div>
  );
}

function MovementDetailDrawer({
  movement,
  onClose,
}: {
  movement: ProsperityMovementResponseDTO | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!movement) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movement, onClose]);

  if (!mounted || !movement) return null;

  const meta = getMovementTypeMeta(movement.type);
  const subtitle = describeMovement(movement);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex justify-end">
      <div className="absolute inset-0 bg-[#0b1440]/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Detalle del movimiento"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Movimiento #{movement.sequence}</p>
            <h3 className="mt-0.5 text-lg font-bold text-gray-900">{meta.label}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className={`text-3xl font-bold tracking-tight ${amountClass(movement.type)}`}>
            {formatSignedMovement(movement)}
          </p>
          <dl className="mt-4 divide-y divide-gray-100">
            <DetailRow label="Fecha" value={formatProsperityDateTime(movement.effectiveAt)} />
            <DetailRow label="Saldo antes" value={formatProsperityCents(movement.balanceBeforeCents)} />
            <DetailRow label="Saldo después" value={formatProsperityCents(movement.balanceAfterCents)} />
            {movement.saleAmountCents != null && (
              <DetailRow label="Valor de la venta" value={formatProsperityCents(movement.saleAmountCents)} />
            )}
            {movement.originId && (
              <DetailRow
                label="Origen"
                value={`${movement.originType ?? ''} #${movement.originId}`.trim()}
              />
            )}
            {movement.cause && <DetailRow label="Causal" value={movement.cause} />}
            {movement.supportRef && <DetailRow label="Soporte" value={movement.supportRef} />}
          </dl>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

'use client';

import React from 'react';
import { AlertTriangle, BookLock, Link2, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useAdminProsperityMovements } from '@/hooks/prosperity/useProsperity';
import type { ProsperityMovementResponseDTO } from '@/types/commercial/Prosperity.types';
import {
  formatProsperityCents,
  formatProsperityDateTime,
  formatSignedMovement,
  getMovementTypeMeta,
} from '@/utils/prosperity';
import { ProsperityPagination, Th } from '@/components/prosperity/ProsperityUI';

// Libro Mayor: solo lectura, sin editar ni borrar (el libro es inmutable).
// La única acción es compensar un asiento con un ajuste nuevo.

const amountClass = (type: string) =>
  getMovementTypeMeta(type).credit ? 'text-green-600' : 'text-gray-700';

const origin = (m: ProsperityMovementResponseDTO) =>
  m.originType || m.originId ? `${m.originType ?? ''}${m.originId ? ` #${m.originId}` : ''}`.trim() : '—';

function RowIndicators({ m }: { m: ProsperityMovementResponseDTO }) {
  const uncovered = (m.uncoveredCents ?? 0) > 0;
  if (m.relatedEntryId == null && !uncovered) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {m.relatedEntryId != null && (
        <span className="inline-flex items-center gap-1 rounded-full bg-admin-blue/10 px-2 py-0.5 text-[11px] font-medium text-admin-blue">
          <Link2 className="h-3 w-3" />
          Compensa el asiento #{m.relatedEntryId}
        </span>
      )}
      {uncovered && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <AlertTriangle className="h-3 w-3" />
          No cubierto: {formatProsperityCents(m.uncoveredCents)}
        </span>
      )}
    </div>
  );
}

function AdjustButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-admin-blue transition hover:bg-admin-blue/10"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Ajustar este asiento
    </button>
  );
}

interface Props {
  publicId: string;
  page: number;
  onPageChange: (page: number) => void;
  onAdjustEntry: (entryId: number) => void;
}

export function ProsperityLedgerTable({ publicId, page, onPageChange, onAdjustEntry }: Props) {
  const { data, isLoading, isError, isFetching, refetch } = useAdminProsperityMovements(publicId, page);
  const movements = data?.data ?? [];

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookLock className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-800">Libro Mayor</h4>
          <span className="text-xs text-gray-400">· solo lectura</span>
        </div>
        {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-admin-blue" />
        </div>
      ) : isError ? (
        <div className="m-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo cargar el Libro Mayor.
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      ) : movements.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Sin asientos registrados.</p>
      ) : (
        <>
          {/* Escritorio */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <Th>#</Th>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th align="right">Valor</Th>
                  <Th align="right">Saldo antes</Th>
                  <Th align="right">Saldo después</Th>
                  <Th>Compensa</Th>
                  <Th align="right">No cubierto</Th>
                  <Th>Origen</Th>
                  <Th>Registrado por</Th>
                  <Th>Causal</Th>
                  <Th align="right">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map((m) => (
                  <tr key={m.id} className="align-top hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.sequence}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatProsperityDateTime(m.effectiveAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {getMovementTypeMeta(m.type).label}
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
                    <td className="whitespace-nowrap px-4 py-3">
                      {m.relatedEntryId != null ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-admin-blue/10 px-2 py-0.5 text-xs font-medium text-admin-blue">
                          <Link2 className="h-3 w-3" />
                          Asiento #{m.relatedEntryId}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {(m.uncoveredCents ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {formatProsperityCents(m.uncoveredCents)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{origin(m)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.performedBy ?? '—'}</td>
                    <td className="max-w-56 px-4 py-3 text-xs text-gray-600">
                      <span className="line-clamp-3" title={m.cause ?? undefined}>
                        {m.cause ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdjustButton onClick={() => onAdjustEntry(m.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil / tablet */}
          <ul className="divide-y divide-gray-100 lg:hidden">
            {movements.map((m) => (
              <li key={m.id} className="space-y-1.5 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="mr-1 font-mono text-xs text-gray-400">#{m.sequence}</span>
                      {getMovementTypeMeta(m.type).label}
                    </p>
                    <RowIndicators m={m} />
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${amountClass(m.type)}`}>
                    {formatSignedMovement(m)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatProsperityDateTime(m.effectiveAt)} · {formatProsperityCents(m.balanceBeforeCents)} →{' '}
                  {formatProsperityCents(m.balanceAfterCents)}
                </p>
                <p className="text-xs text-gray-500">
                  Origen: <span className="font-mono">{origin(m)}</span> · Registrado por: {m.performedBy ?? '—'}
                </p>
                {m.cause && <p className="text-xs text-gray-600">Causal: {m.cause}</p>}
                <div className="flex justify-end">
                  <AdjustButton onClick={() => onAdjustEntry(m.id)} />
                </div>
              </li>
            ))}
          </ul>

          {data && <ProsperityPagination meta={data.meta} onPageChange={onPageChange} loading={isFetching} />}
        </>
      )}
    </section>
  );
}

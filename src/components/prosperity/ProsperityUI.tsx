'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type {
  ProsperityStatus,
  ProsperityThresholdsResponse,
} from '@/types/commercial/Prosperity.types';
import type { PagedResponse } from '@/types/Generic.types';
import { formatProsperityCents, formatProsperityDate, formatProsperityDateTime } from '@/utils/prosperity';

// Componentes compartidos del Saldo de Prosperidad (panel del empresario y
// pestaña del admin). Recordatorio: el Saldo NO es dinero — sin íconos de
// billetera/dinero y sin textos que lo presenten como tal.

// ─── Badge de estado ─────────────────────────────────────────────────────────

const STATUS_BADGE: Partial<Record<ProsperityStatus, { label: string; classes: string }>> = {
  ACTIVE: { label: 'Activo', classes: 'bg-green-100 text-green-700 border-green-200' },
  FROZEN: { label: 'Congelado', classes: 'bg-sky-100 text-sky-700 border-sky-200' },
};

export function ProsperityStatusBadge({ status }: { status: ProsperityStatus | string }) {
  const cfg = STATUS_BADGE[status as ProsperityStatus];
  if (!cfg) return null; // NOT_APPLICABLE -> no se muestra nada
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ─── Disclaimer (siempre visible, nunca en tooltip) ──────────────────────────

export function ProsperityDisclaimer({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-relaxed text-gray-500 ${className}`}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span>{text}</span>
    </p>
  );
}

// ─── Indicadores ─────────────────────────────────────────────────────────────

export interface ProsperityIndicatorItem {
  label: string;
  cents: number;
  hint?: string;
}

// Clases literales para que Tailwind las detecte en build.
const INDICATOR_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function ProsperityIndicators({ items }: { items: ProsperityIndicatorItem[] }) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${INDICATOR_COLS[Math.min(items.length, 4)] ?? ''}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">{item.label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-gray-900">{formatProsperityCents(item.cents)}</p>
          {item.hint && <p className="mt-0.5 text-[11px] text-gray-400">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Tabla de Umbrales ───────────────────────────────────────────────────────

// Un Umbral revertido ya no aporta al Saldo: se marca con la fecha de reversión.
function ThresholdStateBadge({ t }: { t: ProsperityThresholdsResponse }) {
  if (!t.reversed) {
    return (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Vigente
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Revertido
      </span>
      {t.reversedAt && (
        <span className="whitespace-nowrap text-[11px] text-gray-500">el {formatProsperityDateTime(t.reversedAt)}</span>
      )}
    </span>
  );
}

const generatedClass = (t: ProsperityThresholdsResponse) =>
  t.reversed ? 'text-gray-400 line-through' : 'text-gray-900';

interface ThresholdsTableProps {
  thresholds: ProsperityThresholdsResponse[];
  emptyMessage?: string;
  renderActions?: (t: ProsperityThresholdsResponse) => React.ReactNode;
}

export function ProsperityThresholdsTable({
  thresholds,
  emptyMessage = 'Aún no tienes Umbrales. Se generan al confirmarse cada inversión.',
  renderActions,
}: ThresholdsTableProps) {
  if (thresholds.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Escritorio */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <Th>Fecha</Th>
              <Th align="right">Inversión neta</Th>
              <Th align="center">Multiplicador</Th>
              <Th align="right">Umbral generado</Th>
              <Th>Estado</Th>
              {renderActions && <Th align="right">Acciones</Th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {thresholds.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatProsperityDate(t.validatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                  {formatProsperityCents(t.investmentNetCents)}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-600">× {t.multiplier}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${generatedClass(t)}`}>
                  {formatProsperityCents(t.generatedCents)}
                </td>
                <td className="px-4 py-3">
                  <ThresholdStateBadge t={t} />
                </td>
                {renderActions && <td className="px-4 py-3 text-right">{renderActions(t)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <ul className="space-y-2 md:hidden">
        {thresholds.map((t) => (
          <li key={t.id} className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{formatProsperityDate(t.validatedAt)}</span>
              <span className={`text-sm font-semibold ${generatedClass(t)}`}>
                {formatProsperityCents(t.generatedCents)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Inversión neta {formatProsperityCents(t.investmentNetCents)} · × {t.multiplier}
            </p>
            <div className="mt-2">
              <ThresholdStateBadge t={t} />
            </div>
            {renderActions && <div className="mt-2 flex justify-end">{renderActions(t)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function Th({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

// ─── Paginación ──────────────────────────────────────────────────────────────

export function ProsperityPagination({
  meta,
  onPageChange,
  loading,
}: {
  meta: PagedResponse<unknown>['meta'];
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500">
        {meta.totalElements} registros · Página {meta.page + 1} de {Math.max(meta.totalPages, 1)}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevious || loading}
          aria-label="Página anterior"
          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNext || loading}
          aria-label="Página siguiente"
          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Barra de progreso "Consumido X de Y" ────────────────────────────────────

export function ProsperityConsumptionBar({
  balanceCents,
  accumulatedThresholdCents,
}: {
  balanceCents: number;
  accumulatedThresholdCents: number;
}) {
  const consumed = Math.max(0, accumulatedThresholdCents - balanceCents);
  const pct = accumulatedThresholdCents > 0 ? Math.min(100, (consumed / accumulatedThresholdCents) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          Consumido {formatProsperityCents(consumed)} de {formatProsperityCents(accumulatedThresholdCents)}
        </span>
        <span className="font-semibold text-gray-600">{Math.round(pct)}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[#03548C] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

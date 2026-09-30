'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, Loader2, PlusCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BudgetIncreaseResponse } from '@/types/BudgetIncrease.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncreaseBudgetMode =
  | {
      /** Se compran unidades al precio congelado del activo (likes, cupos de respuesta). */
      kind: 'units';
      unitSingular: string;
      unitPlural: string;
      /** Costo de UNA unidad, en centavos (rewardPerLike; preguntas × precio por pregunta). */
      unitCostCents: number;
      /** Capacidad actual (maxLikes / maxResponses). */
      currentTotal: number;
      /** Tope de la capacidad total, si el backend define uno. */
      maxTotal?: number;
      quickPicks: number[];
    }
  | {
      /** El presupuesto es un monto libre (campañas): se ingresa en pesos. */
      kind: 'amount';
      /** Presupuesto actual, en centavos. */
      currentBudgetCents: number;
      /** Atajos, en pesos. */
      quickPicksPesos: number[];
    };

interface Props {
  /** Para los textos: "anuncio", "encuesta", "campaña". */
  assetLabel: string;
  assetName: string;
  mode: IncreaseBudgetMode;
  /** El activo está COMPLETED: el aumento lo vuelve a poner en circulación. */
  willReopen: boolean;
  /** Saldo de la wallet, en centavos (null/undefined si aún no se conoce). */
  balanceCents: number | null | undefined;
  /**
   * Ejecuta el aumento. Recibe la cantidad de unidades (modo `units`) o los centavos (modo
   * `amount`). El llamador debe enviar la capacidad ACTUAL como `expected*` — es lo que protege
   * contra el doble cobro (ver BudgetIncrease.types.ts).
   */
  onSubmit: (amount: number) => Promise<BudgetIncreaseResponse>;
  /** Se llama tras un aumento exitoso (refrescar datos); el llamador cierra el modal. */
  onSuccess: (result: BudgetIncreaseResponse) => void;
  /** El backend respondió 409: el presupuesto cambió desde que se abrió el modal. Recargar datos. */
  onStale: () => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Forma mínima de un error de axios con la respuesta del backend ({ message }). */
interface ApiErrorLike {
  response?: { status?: number; data?: { message?: string } };
}

const formatCents = (cents: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);

const formatInt = (n: number): string => n.toLocaleString('es-CO');

// ─── Component ────────────────────────────────────────────────────────────────

export function IncreaseBudgetModal({
  assetLabel,
  assetName,
  mode,
  willReopen,
  balanceCents,
  onSubmit,
  onSuccess,
  onStale,
  onClose,
}: Props) {
  const titleId = useId();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Candado SÍNCRONO contra el doble envío: `submitting` recién se refleja en el siguiente render,
   * así que un segundo clic (o Enter) en el mismo instante aún vería el botón habilitado. El ref
   * cambia al instante. El backend además rechaza el reenvío con 409 (capacidad esperada), pero
   * mejor no enviarlo.
   */
  const submitLock = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitLock.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Derivados ──────────────────────────────────────────────────────────────

  const parsed = value === '' ? 0 : Number(value);
  const entered = Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 0;

  const isUnits = mode.kind === 'units';
  const unitCostCents = isUnits ? mode.unitCostCents : 0;
  const costCents = isUnits ? entered * unitCostCents : entered * 100;
  /** Lo que recibe el backend: unidades, o centavos. */
  const amountToSend = isUnits ? entered : entered * 100;

  const maxAdditional =
    isUnits && mode.maxTotal != null ? Math.max(0, mode.maxTotal - mode.currentTotal) : null;
  const overMax = maxAdditional != null && entered > maxAdditional;
  const insufficient = balanceCents != null && costCents > balanceCents;
  const canSubmit = entered > 0 && !overMax && !insufficient && !submitting;

  const unitWord = (n: number) =>
    isUnits ? (n === 1 ? mode.unitSingular : mode.unitPlural) : '';

  // ── Envío ──────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (submitLock.current || !canSubmit) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(amountToSend);
      toast.success(
        result.reopened
          ? `Presupuesto aumentado. Tu ${assetLabel} volvió a activarse.`
          : 'Presupuesto aumentado correctamente.',
      );
      // El candado queda puesto: el modal se cierra y no debe poder reenviarse.
      onSuccess(result);
    } catch (err) {
      const { response } = err as ApiErrorLike;
      const status = response?.status;
      const message = response?.data?.message;

      if (status === 409) {
        // Otro aumento se aplicó primero (doble clic, otra pestaña, reintento tras perder la
        // respuesta). NO se cobró: se recargan los datos para que la persona decida con lo nuevo.
        toast.error(
          message ?? 'El presupuesto cambió. Actualizamos la información; revísala e inténtalo de nuevo.',
          { duration: 6000 },
        );
        onStale();
        onClose();
        return;
      }

      // Los 402 (saldo agotado) y "cambio de plan en curso" ya los muestra un modal global
      // desde el interceptor; aun así se deja el mensaje aquí por si el modal se cierra.
      setError(message ?? 'No se pudo aumentar el presupuesto. Inténtalo de nuevo.');
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!submitLock.current) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              Aumentar presupuesto
            </h2>
            <p className="mt-0.5 truncate text-sm text-gray-500" title={assetName}>
              {assetName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {willReopen && (
            <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Este {assetLabel} está completado. Al aumentar el presupuesto volverá a activarse y
                volverá a ocupar un cupo de tu plan.
              </p>
            </div>
          )}

          {/* Estado actual */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
            {isUnits ? (
              <p>
                Actualmente permite <strong className="text-gray-900">{formatInt(mode.currentTotal)}</strong>{' '}
                {mode.unitPlural}. Cada {mode.unitSingular} adicional cuesta{' '}
                <strong className="text-gray-900">{formatCents(mode.unitCostCents)}</strong>.
              </p>
            ) : (
              <p>
                Presupuesto actual:{' '}
                <strong className="text-gray-900">{formatCents(mode.currentBudgetCents)}</strong>.
              </p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label htmlFor={`${titleId}-amount`} className="mb-1.5 block text-sm font-medium text-gray-700">
              {isUnits ? `¿Cuántos ${mode.unitPlural} quieres agregar?` : '¿Cuánto quieres agregar? (COP)'}
            </label>
            <input
              id={`${titleId}-amount`}
              type="text"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              disabled={submitting}
              value={value}
              placeholder={isUnits ? 'Ej. 100' : 'Ej. 50000'}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] disabled:bg-gray-50"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(isUnits ? mode.quickPicks : mode.quickPicksPesos).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={submitting}
                  onClick={() => setValue(String(n))}
                  className="cursor-pointer rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-[#03548C] hover:text-[#03548C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +{isUnits ? formatInt(n) : formatCents(n * 100)}
                </button>
              ))}
            </div>
            {overMax && maxAdditional != null && (
              <p className="mt-2 text-xs text-red-600">
                Como máximo puedes agregar {formatInt(maxAdditional)} {mode.kind === 'units' ? mode.unitPlural : ''} más.
              </p>
            )}
          </div>

          {/* Resumen */}
          {entered > 0 && !overMax && (
            <dl className="space-y-1.5 rounded-xl border border-gray-100 p-3 text-sm">
              <SummaryRow
                label="Costo"
                value={formatCents(costCents)}
                hint={isUnits ? `${formatInt(entered)} × ${formatCents(unitCostCents)}` : undefined}
                strong
              />
              {isUnits ? (
                <SummaryRow
                  label="Nuevo total"
                  value={`${formatInt(mode.currentTotal + entered)} ${unitWord(mode.currentTotal + entered)}`}
                />
              ) : (
                <SummaryRow label="Nuevo presupuesto" value={formatCents(mode.currentBudgetCents + costCents)} />
              )}
              {balanceCents != null && (
                <SummaryRow
                  label="Saldo después"
                  value={formatCents(balanceCents - costCents)}
                  tone={insufficient ? 'danger' : undefined}
                />
              )}
            </dl>
          )}

          {insufficient && (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Tu saldo ({formatCents(balanceCents ?? 0)}) no alcanza para este aumento.{' '}
                <Link href="/commercial/balance" className="font-semibold underline">
                  Recargar saldo
                </Link>
              </p>
            </div>
          )}

          {error && (
            <div role="alert" className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#03548C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0b1440] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? 'Procesando…' : 'Confirmar y pagar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  hint,
  strong,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
  tone?: 'danger';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-gray-500">
        {label}
        {hint && <span className="ml-1.5 text-xs text-gray-400">({hint})</span>}
      </dt>
      <dd
        className={`text-right ${
          tone === 'danger'
            ? 'font-semibold text-red-600'
            : strong
              ? 'font-bold text-gray-900'
              : 'font-medium text-gray-700'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

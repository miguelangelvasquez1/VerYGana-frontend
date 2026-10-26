'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2 } from 'lucide-react';
import { adjust } from '@/services/admin/AdminProsperityService';
import type { ProsperityMovementResponseDTO } from '@/types/commercial/Prosperity.types';
import {
  formatProsperityCents,
  generateIdempotencyKey,
  parseProsperityError,
} from '@/utils/prosperity';
import { FieldError, ProsperityModalShell, inputClass } from './ProsperityModalShell';

const MAX_LEN = 500;

const parsePesos = (raw: string) => parseInt(raw.replace(/\D/g, ''), 10) || 0;
const formatPesosInput = (raw: string) => {
  const n = parsePesos(raw);
  return n ? new Intl.NumberFormat('es-CO').format(n) : '';
};

interface Props {
  publicId: string;
  balanceCents: number;
  /** Viene lleno cuando se abre desde "Ajustar este asiento". */
  relatedEntryId?: number | null;
  onClose: () => void;
  onAdjusted: (movement: ProsperityMovementResponseDTO) => void;
}

export function AdjustmentModal({ publicId, balanceCents, relatedEntryId, onClose, onAdjusted }: Props) {
  // Se genera una sola vez al abrir el modal y se reutiliza en cada reintento:
  // un doble clic o un reintento tras un error de red no crea dos ajustes.
  const [idempotencyKey] = useState(generateIdempotencyKey);
  const [credit, setCredit] = useState<boolean | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [cause, setCause] = useState('');
  const [supportRef, setSupportRef] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const amountPesos = parsePesos(amountInput);
  const amountCents = amountPesos * 100;
  const resultingCents =
    credit == null ? balanceCents : credit ? balanceCents + amountCents : balanceCents - amountCents;
  const wouldBeNegative = credit === false && resultingCents < 0;

  const mutation = useMutation({
    mutationFn: () =>
      adjust(publicId, {
        credit: credit!,
        amountCents,
        cause: cause.trim(),
        supportRef: supportRef.trim() || null,
        relatedEntryId: relatedEntryId ?? null,
        idempotencyKey,
      }),
    onSuccess: (movement) => onAdjusted(movement),
    onError: (err) => {
      const { status, message, details } = parseProsperityError(err);
      if (status === 400 && Object.keys(details).length > 0) {
        setFieldErrors(details);
        setFormError(null);
      } else {
        setFormError(message);
      }
    },
  });

  const canSubmit =
    credit != null && amountPesos > 0 && cause.trim().length > 0 && !wouldBeNegative && !mutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setFormError(null);
    setFieldErrors({});
    mutation.mutate();
  };

  const clearField = (key: string) => setFieldErrors((f) => ({ ...f, [key]: '' }));

  return (
    <ProsperityModalShell
      title="Registrar ajuste de Saldo de Prosperidad"
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-admin-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? 'Registrando…' : 'Registrar ajuste'}
          </button>
        </div>
      }
    >
      {relatedEntryId != null && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Asiento relacionado</label>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Corrige el asiento #{relatedEntryId}
          </p>
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-gray-700">
          Tipo <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { value: true, label: 'A favor del empresario (+)' },
            { value: false, label: 'En contra (−)' },
          ].map((opt) => (
            <label
              key={String(opt.value)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                credit === opt.value ? 'border-admin-blue bg-admin-blue/5 text-gray-900' : 'border-gray-200 text-gray-600'
              }`}
            >
              <input
                type="radio"
                name="prosperity-adjustment-type"
                checked={credit === opt.value}
                onChange={() => {
                  setCredit(opt.value);
                  clearField('credit');
                }}
                disabled={mutation.isPending}
                className="accent-admin-blue"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.credit} />
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Valor <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(formatPesosInput(e.target.value));
              clearField('amountCents');
            }}
            disabled={mutation.isPending}
            placeholder="0"
            className={`${inputClass(!!fieldErrors.amountCents)} pl-7 pr-14`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">COP</span>
        </div>
        <FieldError message={fieldErrors.amountCents} />
      </div>

      {/* Vista previa en vivo */}
      <div
        className={`rounded-lg border p-3 text-sm ${
          wouldBeNegative ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700">
          <span>
            Saldo actual <span className="font-semibold">{formatProsperityCents(balanceCents)}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span>
            Saldo resultante{' '}
            <span className={`font-semibold ${wouldBeNegative ? 'text-red-700' : 'text-gray-900'}`}>
              {resultingCents < 0 ? '−' : ''}
              {formatProsperityCents(Math.abs(resultingCents))}
            </span>
          </span>
        </div>
        {wouldBeNegative && (
          <p className="mt-1.5 text-xs font-medium text-red-700">El ajuste no puede dejar el Saldo en negativo.</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Causal <span className="text-red-500">*</span>
        </label>
        <textarea
          value={cause}
          onChange={(e) => {
            setCause(e.target.value.slice(0, MAX_LEN));
            clearField('cause');
          }}
          maxLength={MAX_LEN}
          rows={3}
          disabled={mutation.isPending}
          className={inputClass(!!fieldErrors.cause)}
        />
        <div className="flex justify-between">
          <FieldError message={fieldErrors.cause} />
          <span className="ml-auto mt-1 text-xs text-gray-400">
            {cause.length}/{MAX_LEN}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Soporte</label>
        <input
          type="text"
          value={supportRef}
          onChange={(e) => {
            setSupportRef(e.target.value.slice(0, MAX_LEN));
            clearField('supportRef');
          }}
          maxLength={MAX_LEN}
          disabled={mutation.isPending}
          className={inputClass(!!fieldErrors.supportRef)}
        />
        <FieldError message={fieldErrors.supportRef} />
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}
    </ProsperityModalShell>
  );
}

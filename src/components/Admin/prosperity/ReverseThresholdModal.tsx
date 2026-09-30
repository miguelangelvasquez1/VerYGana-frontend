'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { reserveThreshold } from '@/services/admin/AdminProsperityService';
import type {
  ProsperityMovementResponseDTO,
  ProsperityThresholdsResponse,
} from '@/types/commercial/Prosperity.types';
import { formatProsperityCents, parseProsperityError } from '@/utils/prosperity';
import { FieldError, ProsperityModalShell, inputClass } from './ProsperityModalShell';

const MAX_LEN = 500;

interface Props {
  threshold: ProsperityThresholdsResponse;
  balanceCents: number;
  onClose: () => void;
  onReversed: (movement: ProsperityMovementResponseDTO) => void;
}

export function ReverseThresholdModal({ threshold, balanceCents, onClose, onReversed }: Props) {
  const [cause, setCause] = useState('');
  const [supportRef, setSupportRef] = useState('');
  // Doble paso: el primer clic arma la confirmación, el segundo envía.
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      reserveThreshold(threshold.investmentId, {
        cause: cause.trim(),
        supportRef: supportRef.trim() || null,
      }),
    onSuccess: (movement) => onReversed(movement),
    onError: (err) => {
      const { status, message, details } = parseProsperityError(err);
      setConfirming(false);
      if (status === 400 && Object.keys(details).length > 0) {
        setFieldErrors(details);
        setFormError(null);
      } else {
        setFormError(message);
      }
    },
  });

  const causeMissing = cause.trim().length === 0;

  const handlePrimary = () => {
    if (mutation.isPending) return;
    if (causeMissing) {
      setFieldErrors({ cause: 'La causal es obligatoria.' });
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setFormError(null);
    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <ProsperityModalShell
      title={`Revertir Umbral de la inversión #${threshold.investmentId}`}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={confirming ? () => setConfirming(false) : onClose}
            disabled={mutation.isPending}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {confirming ? 'Volver' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={mutation.isPending || causeMissing}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? 'Revirtiendo…' : confirming ? 'Sí, revertir definitivamente' : 'Revertir Umbral'}
          </button>
        </div>
      }
    >
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        Umbral original: <span className="font-semibold">{formatProsperityCents(threshold.generatedCents)}</span> (×{' '}
        {threshold.multiplier}). Saldo actual:{' '}
        <span className="font-semibold">{formatProsperityCents(balanceCents)}</span>.
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-amber-800">
          Úsalo solo si la inversión fue anulada, reembolsada o tuvo contracargo. Se retirará del Saldo lo que quede de
          este Umbral. No se puede deshacer; solo se corrige con un ajuste.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Causal <span className="text-red-500">*</span>
        </label>
        <textarea
          value={cause}
          onChange={(e) => {
            setCause(e.target.value.slice(0, MAX_LEN));
            setFieldErrors((f) => ({ ...f, cause: '' }));
            setConfirming(false);
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
            setFieldErrors((f) => ({ ...f, supportRef: '' }));
          }}
          maxLength={MAX_LEN}
          disabled={mutation.isPending}
          placeholder="Ej. nota crédito o referencia del reembolso"
          className={inputClass(!!fieldErrors.supportRef)}
        />
        <FieldError message={fieldErrors.supportRef} />
      </div>

      {confirming && !mutation.isPending && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          ¿Confirmas la reversión? Esta acción no se puede deshacer. Vuelve a pulsar el botón para continuar.
        </p>
      )}

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}
    </ProsperityModalShell>
  );
}

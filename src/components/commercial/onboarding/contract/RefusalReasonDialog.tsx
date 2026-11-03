'use client';

import { useEffect, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog } from '@/components/shared/Dialog';
import { FORMALIZATION_TEXTS } from '@/lib/labels/formalizationCommitment';
import {
  REFUSAL_REASON_MAX,
  refusalReasonSchema,
  type RefusalReasonFormValues,
} from '@/lib/formalization/refusalReasonSchema';

interface RefusalReasonDialogProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

// Confirmación de la negativa con motivo opcional (spec 015, CA-5 y CA-7).
// Solo "Confirmar" cambia la decisión; cerrar de cualquier otra forma la deja igual.
export function RefusalReasonDialog({ open, onConfirm, onClose }: RefusalReasonDialogProps) {
  const fieldId = useId();
  const counterId = `${fieldId}-counter`;
  const errorId = `${fieldId}-error`;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RefusalReasonFormValues>({
    resolver: zodResolver(refusalReasonSchema),
    defaultValues: { reason: '' },
  });

  // Cada vez que se abre, el campo empieza vacío.
  useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  const reason = useWatch({ control, name: 'reason' }) ?? '';
  const error = errors.reason?.message;

  return (
    <Dialog open={open} title={FORMALIZATION_TEXTS.dialogTitle} onClose={onClose}>
      <form onSubmit={handleSubmit((values) => onConfirm(values.reason))} noValidate>
        <label htmlFor={fieldId} className="mb-1 block text-sm font-semibold text-gray-700">
          {FORMALIZATION_TEXTS.reasonLabel}{' '}
          <span className="font-normal text-gray-500">{FORMALIZATION_TEXTS.reasonOptional}</span>
        </label>
        <textarea
          id={fieldId}
          rows={4}
          maxLength={REFUSAL_REASON_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${counterId} ${errorId}` : counterId}
          className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#03548C] focus:outline-none focus:ring-2 focus:ring-[#03548C]/20"
          {...register('reason')}
        />
        <p id={counterId} aria-live="polite" className="mt-1 text-right text-xs text-gray-500">
          {FORMALIZATION_TEXTS.reasonCounter(reason.length)}
        </p>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            {FORMALIZATION_TEXTS.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#03548C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#024266] disabled:opacity-50"
          >
            {FORMALIZATION_TEXTS.confirm}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

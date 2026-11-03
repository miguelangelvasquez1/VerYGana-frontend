'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/shared/Dialog';
import { Field, describedBy, fieldInputClass } from '@/components/commercial/tax-profile/Field';
import { useCloseEstablishment } from '@/hooks/commercial/useTaxProfile';
import { readApiError } from '@/lib/api/apiError';
import {
  closeEstablishmentSchema,
  type CloseEstablishmentFormValues,
} from '@/lib/taxProfile/establishmentSchema';
import type { Establishment } from '@/types/commercial/TaxProfile.types';

function CloseForm({ establishment, onClose }: { establishment: Establishment; onClose: () => void }) {
  const closeEstablishment = useCloseEstablishment();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CloseEstablishmentFormValues>({
    resolver: zodResolver(closeEstablishmentSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await closeEstablishment.mutateAsync({
        id: establishment.id,
        body: { reason: values.reason.trim() },
      });
      toast.success('Sede cerrada');
      onClose();
    } catch (error) {
      toast.error(readApiError(error).message ?? 'No pudimos cerrar la sede. Intenta de nuevo');
    }
  });

  const busy = isSubmitting || closeEstablishment.isPending;

  return (
    <form
      onSubmit={(e) => {
        // El portal propaga `submit` por el árbol de React: sin esto envía la ficha que lo contiene.
        e.stopPropagation();
        void onSubmit(e);
      }}
      noValidate className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Vas a cerrar la sede <strong>{establishment.name}</strong>. Una sede cerrada no se puede
        editar ni reabrir.
      </p>
      <Field id="close-reason" label="Motivo del cierre" required error={errors.reason?.message}>
        <textarea
          id="close-reason"
          rows={3}
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={describedBy('close-reason', Boolean(errors.reason), false)}
          className={fieldInputClass(Boolean(errors.reason))}
          {...register('reason')}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Cerrando…' : 'Cerrar sede'}
        </button>
      </div>
    </form>
  );
}

export function CloseEstablishmentDialog({
  establishment,
  onClose,
}: {
  establishment: Establishment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={establishment !== null} title="Cerrar sede" onClose={onClose}>
      {establishment && <CloseForm establishment={establishment} onClose={onClose} />}
    </Dialog>
  );
}

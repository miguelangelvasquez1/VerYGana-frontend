'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useRetireCatalogEntry } from '@/hooks/compliance/useComplianceTaxProfiles';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { buildRetireBody, retireEntrySchema, type RetireEntryFormValues } from '@/lib/compliance/taxCatalog';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';

export function RetireCatalogEntryDialog({ entry, onClose }: { entry: CatalogEntry; onClose: () => void }) {
  const dateId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useRetireCatalogEntry();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RetireEntryFormValues>({
    resolver: zodResolver(retireEntrySchema(entry.validFrom)),
    defaultValues: { validTo: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: RetireEntryFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync({ id: entry.id, body: buildRetireBody(values) });
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={`${U.retireTitle} · ${entry.code}`} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="mb-3 text-xs text-cmp-slate">{A.catalogImmutableNote}</p>
        <FieldLabel htmlFor={dateId}>{U.catalogRetireDate}</FieldLabel>
        <input
          id={dateId}
          type="date"
          aria-invalid={errors.validTo ? true : undefined}
          aria-describedby={errors.validTo ? `${dateId}-error` : undefined}
          className={dialogInputClass}
          {...register('validTo')}
        />
        <FieldError id={`${dateId}-error`} message={errors.validTo?.message} />
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.retireSubmit} danger />
      </form>
    </Dialog>
  );
}

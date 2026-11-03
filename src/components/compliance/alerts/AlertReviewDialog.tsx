'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useReviewAlert } from '@/hooks/compliance/useComplianceAlerts';
import { alertReviewSchema, buildAlertReviewBody, type AlertReviewFormValues } from '@/lib/compliance/alerts';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

export function AlertReviewDialog({ alertId, onClose }: { alertId: number; onClose: () => void }) {
  const notesId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useReviewAlert(alertId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlertReviewFormValues>({
    resolver: zodResolver(alertReviewSchema),
    defaultValues: { notes: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: AlertReviewFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildAlertReviewBody(values));
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={U.alertReviewTitle} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldLabel htmlFor={notesId}>{U.alertReviewNotes}</FieldLabel>
        <textarea
          id={notesId}
          rows={4}
          maxLength={1000}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? `${notesId}-error` : undefined}
          className={dialogInputClass}
          {...register('notes')}
        />
        <FieldError id={`${notesId}-error`} message={errors.notes?.message} />
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={A.alerts.markReviewed} />
      </form>
    </Dialog>
  );
}

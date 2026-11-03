'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useReviewRequest } from '@/hooks/compliance/useComplianceRequests';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import {
  buildReviewBody,
  reviewRequestSchema,
  type ReviewRequestFormValues,
} from '@/lib/compliance/informationRequestForm';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

// Se monta solo mientras está abierto: cada apertura empieza limpia.
export function RequestReviewDialog({
  requestPublicId,
  onClose,
}: {
  requestPublicId: string;
  onClose: () => void;
}) {
  const notesId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useReviewRequest(requestPublicId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewRequestFormValues>({
    resolver: zodResolver(reviewRequestSchema),
    defaultValues: { result: 'SUFFICIENT', notes: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: ReviewRequestFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildReviewBody(values));
      onClose();
    } catch (error) {
      // Lo escrito no se borra: el oficial puede corregir y reintentar.
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={U.reviewTitle} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset className="mb-3">
          <legend className="mb-1 text-sm font-semibold text-cmp-ink">{U.resultLegend}</legend>
          <div className="flex gap-4 text-sm text-cmp-ink">
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="SUFFICIENT" {...register('result')} />
              {U.resultSufficient}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="INSUFFICIENT" {...register('result')} />
              {U.resultInsufficient}
            </label>
          </div>
        </fieldset>

        <FieldLabel htmlFor={notesId}>{U.reviewNotesLabel}</FieldLabel>
        <textarea
          id={notesId}
          rows={4}
          maxLength={1000}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? `${notesId}-error` : undefined}
          className={dialogInputClass}
          {...register('notes')}
        />
        <p className="mt-1 text-xs text-cmp-slate">{U.reviewNotesRequiredHint}</p>
        <FieldError id={`${notesId}-error`} message={errors.notes?.message} />

        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.reviewSubmit} />
      </form>
    </Dialog>
  );
}

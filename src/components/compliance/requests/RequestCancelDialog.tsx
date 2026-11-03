'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCancelRequest } from '@/hooks/compliance/useComplianceRequests';
import {
  buildCancelBody,
  cancelRequestSchema,
  type CancelRequestFormValues,
} from '@/lib/compliance/informationRequestForm';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

export function RequestCancelDialog({
  requestPublicId,
  onClose,
}: {
  requestPublicId: string;
  onClose: () => void;
}) {
  const reasonId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCancelRequest(requestPublicId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelRequestFormValues>({
    resolver: zodResolver(cancelRequestSchema),
    defaultValues: { reason: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: CancelRequestFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildCancelBody(values));
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={U.cancelRequestTitle} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldLabel htmlFor={reasonId}>{U.cancelReasonLabel}</FieldLabel>
        <textarea
          id={reasonId}
          rows={4}
          maxLength={1000}
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={errors.reason ? `${reasonId}-error` : undefined}
          className={dialogInputClass}
          {...register('reason')}
        />
        <FieldError id={`${reasonId}-error`} message={errors.reason?.message} />
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.cancelRequestSubmit} danger />
      </form>
    </Dialog>
  );
}

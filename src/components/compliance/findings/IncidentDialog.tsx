'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCaseRequests, useCreateIncident } from '@/hooks/compliance/useComplianceCase';
import {
  buildIncidentBody,
  incidentSchema,
  type IncidentFormValues,
} from '@/lib/compliance/findingForm';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';

// D-5: el selector ofrece solo la primera página (los 20 requerimientos más recientes).
export function IncidentDialog({
  commercialPublicId,
  onClose,
}: {
  commercialPublicId: string;
  onClose: () => void;
}) {
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateIncident(commercialPublicId);
  const requests = useCaseRequests(commercialPublicId, 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { commercialPublicId, context: '', description: '', requestPublicId: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: IncidentFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildIncidentBody(values));
      toast.success(U.incidentSaved);
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  const contextId = `${baseId}-context`;
  const descriptionId = `${baseId}-description`;
  const requestId = `${baseId}-request`;

  return (
    <Dialog open title={U.incidentTitle} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <FieldLabel htmlFor={contextId}>{U.contextLabel}</FieldLabel>
          <input
            id={contextId}
            type="text"
            maxLength={100}
            aria-invalid={errors.context ? true : undefined}
            aria-describedby={errors.context ? `${contextId}-error` : undefined}
            className={dialogInputClass}
            {...register('context')}
          />
          <FieldError id={`${contextId}-error`} message={errors.context?.message} />
        </div>
        <div>
          <FieldLabel htmlFor={descriptionId}>{U.incidentDescriptionLabel}</FieldLabel>
          <textarea
            id={descriptionId}
            rows={4}
            maxLength={1000}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
            className={dialogInputClass}
            {...register('description')}
          />
          <FieldError id={`${descriptionId}-error`} message={errors.description?.message} />
        </div>
        <div>
          <FieldLabel htmlFor={requestId}>{U.relatedRequestLabel}</FieldLabel>
          <select id={requestId} className={dialogInputClass} {...register('requestPublicId')}>
            <option value="">{U.noRelatedRequest}</option>
            {(requests.data?.data ?? []).map((r) => (
              <option key={r.publicId} value={r.publicId}>
                {TRIGGER_LABELS[r.trigger]} · {formatBogotaDateTime(r.issuedAt)}
              </option>
            ))}
          </select>
        </div>
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.incidentSubmit} />
      </form>
    </Dialog>
  );
}

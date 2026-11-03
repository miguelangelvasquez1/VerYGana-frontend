'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { AccountMeasureConfirmDialog } from '@/components/compliance/findings/AccountMeasureConfirmDialog';
import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCaseCommitment, useCreateFinding } from '@/hooks/compliance/useComplianceCase';
import {
  allowedMeasures,
  buildFindingBody,
  changesAccount,
  CONTRACTUAL_MEASURES,
  expressRefusalAvailable,
  FINDING_CLASSIFICATIONS,
  FINDING_SEVERITIES,
  findingSchema,
  measureAfterClassificationChange,
  type FindingFormValues,
} from '@/lib/compliance/findingForm';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import {
  ACCOUNT_STATUS_LABELS,
  CONTRACTUAL_MEASURE_LABELS,
  FINDING_CLASSIFICATION_LABELS,
  FINDING_SEVERITY_LABELS,
} from '@/lib/labels/taxCompliance';
import type { FindingClassification, FindingRequest } from '@/types/compliance/InformationRequest.types';

interface FindingDialogProps {
  commercialPublicId: string;
  // Con requerimiento, la API lo cierra con el hallazgo (RN-11).
  requestPublicId?: string;
  // Sin nombre conocido, las medidas que cambian la cuenta quedan deshabilitadas (D-1).
  companyName: string | null;
  onClose: () => void;
}

export function FindingDialog({ commercialPublicId, requestPublicId, companyName, onClose }: FindingDialogProps) {
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingBody, setPendingBody] = useState<FindingRequest | null>(null);
  const mutation = useCreateFinding(commercialPublicId);
  const commitment = useCaseCommitment(commercialPublicId);
  const refusalAvailable = expressRefusalAvailable(commitment.data);
  const nameKnown = Boolean(companyName && companyName.trim());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FindingFormValues>({
    resolver: zodResolver(findingSchema),
    defaultValues: {
      commercialPublicId,
      requestPublicId: requestPublicId ?? '',
      factObserved: '',
      evidence: '',
      classification: '',
      severity: '',
      impact: '',
      remediable: null,
      contractualBasis: '',
      measure: '',
      measureScope: '',
    },
  });
  const busy = isSubmitting || mutation.isPending;
  const classification = watch('classification');
  const measure = watch('measure');
  const remediable = watch('remediable');
  const measures = classification === '' ? CONTRACTUAL_MEASURES : allowedMeasures(classification);

  const send = async (body: FindingRequest) => {
    setSubmitError(null);
    try {
      const finding = await mutation.mutateAsync(body);
      toast.success(A.findingSaved);
      if (finding.accountStatusApplied) {
        toast.success(A.accountStatusApplied(ACCOUNT_STATUS_LABELS[finding.accountStatusApplied]));
      }
      onClose();
    } catch (error) {
      // Lo escrito no se borra: el oficial puede corregir y reintentar.
      setSubmitError(actionErrorMessage(error));
    }
  };

  const onSubmit = async (values: FindingFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const body = buildFindingBody(values);
      if (changesAccount(body.measure)) {
        // Sin nombre de empresa no hay confirmación posible (RN-6): se detiene aquí en vez de dejar el diálogo mudo.
        if (!nameKnown) {
          setSubmitError(A.companyNameUnknown);
          return;
        }
        setSubmitError(null);
        setPendingBody(body);
        return;
      }
      await send(body);
    } finally {
      submittingRef.current = false;
    }
  };

  const id = (name: string) => `${baseId}-${name}`;
  const describedBy = (name: keyof FindingFormValues) => (errors[name] ? `${id(name)}-error` : undefined);

  const measureDisabledReason = (value: (typeof CONTRACTUAL_MEASURES)[number]): string | null => {
    if (!measures.includes(value)) return A.measureLimitedNote;
    if (changesAccount(value) && !nameKnown) return A.companyNameUnknown;
    return null;
  };

  return (
    <>
      <Dialog open title={U.findingTitle} onClose={onClose} dismissible={!busy && pendingBody === null} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
          <div>
            <FieldLabel htmlFor={id('fact')}>{U.factLabel}</FieldLabel>
            <textarea
              id={id('fact')}
              rows={3}
              maxLength={2000}
              aria-invalid={errors.factObserved ? true : undefined}
              aria-describedby={describedBy('factObserved')}
              className={dialogInputClass}
              {...register('factObserved')}
            />
            <FieldError id={`${id('factObserved')}-error`} message={errors.factObserved?.message} />
          </div>

          <div>
            <FieldLabel htmlFor={id('evidence')}>{U.evidenceLabel}</FieldLabel>
            <textarea
              id={id('evidence')}
              rows={2}
              maxLength={2000}
              aria-invalid={errors.evidence ? true : undefined}
              aria-describedby={describedBy('evidence')}
              className={dialogInputClass}
              {...register('evidence')}
            />
            <FieldError id={`${id('evidence')}-error`} message={errors.evidence?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor={id('classification')}>{U.classificationLabel}</FieldLabel>
              <select
                id={id('classification')}
                aria-invalid={errors.classification ? true : undefined}
                aria-describedby={describedBy('classification')}
                className={dialogInputClass}
                {...register('classification', {
                  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                    const next = event.target.value as FindingClassification | '';
                    if (next === '') return;
                    setValue('measure', measureAfterClassificationChange(next, measure), {
                      shouldValidate: false,
                    });
                  },
                })}
              >
                <option value="">{U.chooseOption}</option>
                {FINDING_CLASSIFICATIONS.map((value) => {
                  const unavailable = value === 'EXPRESS_REFUSAL' && !refusalAvailable;
                  return (
                    <option key={value} value={value} disabled={unavailable}>
                      {FINDING_CLASSIFICATION_LABELS[value]}
                      {unavailable ? ` · ${A.expressRefusalMissing}` : ''}
                    </option>
                  );
                })}
              </select>
              <FieldError id={`${id('classification')}-error`} message={errors.classification?.message} />
            </div>

            <div>
              <FieldLabel htmlFor={id('severity')}>{U.severityLabel}</FieldLabel>
              <select
                id={id('severity')}
                aria-invalid={errors.severity ? true : undefined}
                aria-describedby={describedBy('severity')}
                className={dialogInputClass}
                {...register('severity')}
              >
                <option value="">{U.chooseOption}</option>
                {FINDING_SEVERITIES.map((value) => (
                  <option key={value} value={value}>
                    {FINDING_SEVERITY_LABELS[value]}
                  </option>
                ))}
              </select>
              <FieldError id={`${id('severity')}-error`} message={errors.severity?.message} />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor={id('impact')}>{U.impactLabel}</FieldLabel>
            <textarea
              id={id('impact')}
              rows={2}
              maxLength={1000}
              aria-invalid={errors.impact ? true : undefined}
              aria-describedby={describedBy('impact')}
              className={dialogInputClass}
              {...register('impact')}
            />
            <FieldError id={`${id('impact')}-error`} message={errors.impact?.message} />
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-cmp-ink">{U.remediableLegend}</legend>
            <div className="flex gap-4 text-sm text-cmp-ink">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={id('remediable')}
                  checked={remediable === true}
                  onChange={() => setValue('remediable', true, { shouldValidate: true })}
                />
                {U.yes}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={id('remediable')}
                  checked={remediable === false}
                  onChange={() => setValue('remediable', false, { shouldValidate: true })}
                />
                {U.no}
              </label>
            </div>
            <FieldError id={`${id('remediable')}-error`} message={errors.remediable?.message} />
          </fieldset>

          <div>
            <FieldLabel htmlFor={id('basis')}>{U.basisLabel}</FieldLabel>
            <textarea
              id={id('basis')}
              rows={2}
              maxLength={1000}
              aria-invalid={errors.contractualBasis ? true : undefined}
              aria-describedby={describedBy('contractualBasis')}
              className={dialogInputClass}
              {...register('contractualBasis')}
            />
            <FieldError id={`${id('contractualBasis')}-error`} message={errors.contractualBasis?.message} />
          </div>

          <div>
            <FieldLabel htmlFor={id('measure')}>{U.measureLabel}</FieldLabel>
            <select
              id={id('measure')}
              aria-invalid={errors.measure ? true : undefined}
              aria-describedby={describedBy('measure')}
              className={dialogInputClass}
              {...register('measure')}
            >
              <option value="">{U.chooseOption}</option>
              {CONTRACTUAL_MEASURES.map((value) => {
                const reason = measureDisabledReason(value);
                return (
                  <option key={value} value={value} disabled={reason !== null}>
                    {CONTRACTUAL_MEASURE_LABELS[value]}
                    {reason ? ` · ${reason}` : ''}
                  </option>
                );
              })}
            </select>
            {measure === 'TERMINATION_REFERRAL' && (
              <p className="mt-1 text-xs text-cmp-slate">{A.terminationNote}</p>
            )}
            <FieldError id={`${id('measure')}-error`} message={errors.measure?.message} />
          </div>

          <div>
            <FieldLabel htmlFor={id('scope')}>{U.measureScopeLabel}</FieldLabel>
            <textarea
              id={id('scope')}
              rows={2}
              maxLength={500}
              aria-invalid={errors.measureScope ? true : undefined}
              aria-describedby={describedBy('measureScope')}
              className={dialogInputClass}
              {...register('measureScope')}
            />
            <FieldError id={`${id('measureScope')}-error`} message={errors.measureScope?.message} />
          </div>

          <FormError message={pendingBody === null ? submitError : null} />
          <DialogFooter busy={busy} onClose={onClose} submitLabel={U.findingSubmit} />
        </form>
      </Dialog>

      {pendingBody && companyName && (
        <AccountMeasureConfirmDialog
          companyName={companyName}
          measureLabel={CONTRACTUAL_MEASURE_LABELS[pendingBody.measure]}
          busy={busy}
          error={submitError}
          onConfirm={() => send(pendingBody)}
          onClose={() => {
            setPendingBody(null);
            setSubmitError(null);
          }}
        />
      )}
    </>
  );
}

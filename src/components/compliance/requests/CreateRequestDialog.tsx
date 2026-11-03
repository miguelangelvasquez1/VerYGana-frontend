'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCreateRequest } from '@/hooks/compliance/useComplianceRequests';
import { useComplianceTaxProfile } from '@/hooks/compliance/useComplianceTaxProfiles';
import { readApiError } from '@/lib/api/apiError';
import {
  buildCreateRequestBody,
  createRequestSchema,
  emptyRequestItem,
  extractDuplicateRequestId,
  REQUEST_DOCUMENT_TYPES,
  REQUEST_ITEM_TYPES,
  REQUEST_TRIGGERS,
  type CreateRequestFormValues,
} from '@/lib/compliance/informationRequestForm';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { requestDetailPath } from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import {
  COMMERCIAL_DOCUMENT_TYPE_LABELS,
  REQUEST_ITEM_TYPE_LABELS,
  TRIGGER_LABELS,
} from '@/lib/labels/taxCompliance';
import type { InformationRequestTrigger } from '@/types/compliance/InformationRequest.types';

interface CreateRequestDialogProps {
  commercialPublicId: string;
  // Desde una alerta: tipo preseleccionado y enlace con la alerta (CA-10).
  fromAlert?: { id: number; trigger: InformationRequestTrigger };
  onClose: () => void;
}

export function CreateRequestDialog({ commercialPublicId, fromAlert, onClose }: CreateRequestDialogProps) {
  const router = useRouter();
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const mutation = useCreateRequest();
  const profile = useComplianceTaxProfile(commercialPublicId);
  // Sin ficha enviada no hay sedes que ofrecer.
  const establishments = profile.data?.profile.activeEstablishments ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      commercialPublicId,
      trigger: fromAlert?.trigger ?? 'NEW_REQUIREMENT',
      reason: '',
      relationToOperation: '',
      dueDate: '',
      alertId: fromAlert?.id ?? null,
      items: [emptyRequestItem()],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: CreateRequestFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    setDuplicateId(null);
    try {
      const created = await mutation.mutateAsync(buildCreateRequestBody(values));
      toast.success(A.requestSent);
      onClose();
      router.push(requestDetailPath(created.publicId));
    } catch (error) {
      const { status, message } = readApiError(error);
      setSubmitError(actionErrorMessage(error));
      if (status === 400) setDuplicateId(extractDuplicateRequestId(message));
    } finally {
      submittingRef.current = false;
    }
  };

  const id = (name: string) => `${baseId}-${name}`;

  return (
    <Dialog open title={U.newRequestTitle} onClose={onClose} dismissible={!busy} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        {fromAlert && <p className="text-xs text-cmp-slate">{U.fromAlertNotice}</p>}

        <div>
          <FieldLabel htmlFor={id('trigger')}>{U.triggerLabel}</FieldLabel>
          <select id={id('trigger')} className={dialogInputClass} {...register('trigger')}>
            {REQUEST_TRIGGERS.map((value) => (
              <option key={value} value={value}>
                {TRIGGER_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor={id('reason')}>{U.reasonField}</FieldLabel>
          <p className="-mt-0.5 mb-1 text-xs text-cmp-slate">{U.reasonHelp}</p>
          <textarea
            id={id('reason')}
            rows={3}
            maxLength={1000}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby={errors.reason ? `${id('reason')}-error` : undefined}
            className={dialogInputClass}
            {...register('reason')}
          />
          <FieldError id={`${id('reason')}-error`} message={errors.reason?.message} />
        </div>

        <div>
          <FieldLabel htmlFor={id('relation')}>{U.relationField}</FieldLabel>
          <p className="-mt-0.5 mb-1 text-xs text-cmp-slate">{U.relationHelp}</p>
          <textarea
            id={id('relation')}
            rows={3}
            maxLength={1000}
            aria-invalid={errors.relationToOperation ? true : undefined}
            aria-describedby={errors.relationToOperation ? `${id('relation')}-error` : undefined}
            className={dialogInputClass}
            {...register('relationToOperation')}
          />
          <FieldError id={`${id('relation')}-error`} message={errors.relationToOperation?.message} />
        </div>

        <div>
          <FieldLabel htmlFor={id('due')}>{U.dueField}</FieldLabel>
          <p className="-mt-0.5 mb-1 text-xs text-cmp-slate">{U.dueHelp}</p>
          <input id={id('due')} type="date" className={dialogInputClass} {...register('dueDate')} />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-cmp-ink">{U.itemsLegend}</legend>
          {typeof errors.items?.message === 'string' && (
            <FieldError id={id('items-error')} message={errors.items.message} />
          )}
          {fields.map((field, index) => {
            const itemType = items[index]?.itemType;
            const itemErrors = errors.items?.[index];
            const prefix = id(`item-${field.id}`);
            return (
              <div key={field.id} className="space-y-2 rounded-xl border border-cmp-rule p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-cmp-ink">{U.itemN(index + 1)}</p>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={U.removeItem(index + 1)}
                      className="rounded-lg p-1 text-cmp-slate hover:bg-cmp-rule-soft"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div>
                  <FieldLabel htmlFor={`${prefix}-type`}>{U.itemTypeLabel}</FieldLabel>
                  <select id={`${prefix}-type`} className={dialogInputClass} {...register(`items.${index}.itemType`)}>
                    {REQUEST_ITEM_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {REQUEST_ITEM_TYPE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>

                {itemType === 'DOCUMENT' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel htmlFor={`${prefix}-doc`}>{U.documentTypeLabel}</FieldLabel>
                      <select
                        id={`${prefix}-doc`}
                        aria-invalid={itemErrors?.documentType ? true : undefined}
                        aria-describedby={itemErrors?.documentType ? `${prefix}-doc-error` : undefined}
                        className={dialogInputClass}
                        {...register(`items.${index}.documentType`)}
                      >
                        <option value="">{U.chooseOption}</option>
                        {REQUEST_DOCUMENT_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {COMMERCIAL_DOCUMENT_TYPE_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      <FieldError id={`${prefix}-doc-error`} message={itemErrors?.documentType?.message} />
                    </div>
                    {establishments.length > 0 && (
                      <div>
                        <FieldLabel htmlFor={`${prefix}-est`}>{U.establishmentLabel}</FieldLabel>
                        <select
                          id={`${prefix}-est`}
                          className={dialogInputClass}
                          {...register(`items.${index}.establishmentId`)}
                        >
                          <option value="">{U.noEstablishment}</option>
                          {establishments.map((e) => (
                            <option key={e.id} value={String(e.id)}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {itemType === 'FIELD' && (
                  <div>
                    <FieldLabel htmlFor={`${prefix}-path`}>{U.fieldPathLabel}</FieldLabel>
                    <input
                      id={`${prefix}-path`}
                      type="text"
                      maxLength={100}
                      aria-invalid={itemErrors?.fieldPath ? true : undefined}
                      aria-describedby={itemErrors?.fieldPath ? `${prefix}-path-error` : undefined}
                      className={dialogInputClass}
                      {...register(`items.${index}.fieldPath`)}
                    />
                    <FieldError id={`${prefix}-path-error`} message={itemErrors?.fieldPath?.message} />
                  </div>
                )}

                <div>
                  <FieldLabel htmlFor={`${prefix}-desc`}>{U.descriptionLabel}</FieldLabel>
                  <textarea
                    id={`${prefix}-desc`}
                    rows={2}
                    maxLength={500}
                    aria-invalid={itemErrors?.description ? true : undefined}
                    aria-describedby={itemErrors?.description ? `${prefix}-desc-error` : undefined}
                    className={dialogInputClass}
                    {...register(`items.${index}.description`)}
                  />
                  <FieldError id={`${prefix}-desc-error`} message={itemErrors?.description?.message} />
                </div>

                <div>
                  <FieldLabel htmlFor={`${prefix}-ok`}>{U.acceptableLabel}</FieldLabel>
                  <textarea
                    id={`${prefix}-ok`}
                    rows={2}
                    maxLength={500}
                    aria-invalid={itemErrors?.acceptableResponse ? true : undefined}
                    aria-describedby={itemErrors?.acceptableResponse ? `${prefix}-ok-error` : undefined}
                    className={dialogInputClass}
                    {...register(`items.${index}.acceptableResponse`)}
                  />
                  <FieldError id={`${prefix}-ok-error`} message={itemErrors?.acceptableResponse?.message} />
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => append(emptyRequestItem())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cmp-rule px-3 py-1.5 text-sm font-medium text-cmp-ink hover:bg-cmp-rule-soft"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {U.addItem}
          </button>
        </fieldset>

        <FormError message={submitError} />
        {duplicateId && (
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(requestDetailPath(duplicateId));
            }}
            className="text-sm font-semibold text-cmp-azul underline"
          >
            {U.openExisting}
          </button>
        )}
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.sendRequest} />
      </form>
    </Dialog>
  );
}

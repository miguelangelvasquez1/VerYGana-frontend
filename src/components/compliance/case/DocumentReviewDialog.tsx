'use client';

import { useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Dialog } from '@/components/shared/Dialog';
import { useReviewCaseDocument } from '@/hooks/compliance/useComplianceCase';
import {
  buildDocumentReviewBody,
  createDocumentReviewSchema,
  DOCUMENT_NOTES_MAX,
  documentReviewDefaults,
  documentReviewErrorOutcome,
  HOLDER_MAX,
  requiresHolder,
  type DocumentReviewFormValues,
} from '@/lib/compliance/documentReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { COMMERCIAL_DOCUMENT_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

interface DocumentReviewDialogProps {
  commercialPublicId: string;
  document: ExpedienteDocument;
  onSaved: () => void;
  onClose: () => void;
}

const RESULT_OPTIONS = [
  { value: 'ACCEPTED', label: T.accept },
  { value: 'OBSERVED', label: T.observe },
  { value: 'REJECTED', label: T.reject },
] as const;

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#03548C] focus:outline-none focus:ring-2 focus:ring-[#03548C]/20';
const labelClass = 'mb-1 block text-sm font-semibold text-gray-700';

// Se monta solo mientras está abierto: cada apertura precarga lo vigente del documento (D-6).
export function DocumentReviewDialog({
  commercialPublicId,
  document,
  onSaved,
  onClose,
}: DocumentReviewDialogProps) {
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useReviewCaseDocument(commercialPublicId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DocumentReviewFormValues>({
    resolver: zodResolver(createDocumentReviewSchema(document.documentType)),
    defaultValues: documentReviewDefaults(document),
  });

  const result = useWatch({ control, name: 'result' });
  const hasValidity = useWatch({ control, name: 'hasValidity' });
  const issuedAt = useWatch({ control, name: 'issuedAt' });

  const busy = isSubmitting || mutation.isPending;
  const holderRequired = result === 'ACCEPTED' && requiresHolder(document.documentType);
  const notesRequired = result === 'OBSERVED' || result === 'REJECTED';

  const onSubmit = async (values: DocumentReviewFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync({ documentId: document.id, body: buildDocumentReviewBody(values) });
      onSaved();
      onClose();
    } catch (error) {
      // Lo escrito no se borra; si la API dijo 400, el hook ya pidió de nuevo la lista (CA-17).
      setSubmitError(documentReviewErrorOutcome(error).message);
    } finally {
      submittingRef.current = false;
    }
  };

  const fieldError = (message: string | undefined, id: string) =>
    message ? (
      <p id={id} role="alert" className="mt-1 text-xs text-red-600">
        {message}
      </p>
    ) : null;

  const holderErrorId = `${baseId}-holder-error`;
  const holderHelpId = `${baseId}-holder-help`;
  const expiresErrorId = `${baseId}-expires-error`;
  const notesErrorId = `${baseId}-notes-error`;
  const resultErrorId = `${baseId}-result-error`;

  return (
    <Dialog
      open
      title={T.reviewDocumentTitle(COMMERCIAL_DOCUMENT_TYPE_LABELS[document.documentType])}
      onClose={onClose}
      dismissible={!busy}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <p className="break-words text-sm text-gray-600">{document.originalFileName}</p>

        <fieldset aria-describedby={errors.result ? resultErrorId : undefined}>
          <legend className={labelClass}>{T.resultLegend}</legend>
          <div className="flex flex-wrap gap-4">
            {RESULT_OPTIONS.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-800">
                <input type="radio" value={option.value} {...register('result')} />
                {option.label}
              </label>
            ))}
          </div>
          {fieldError(errors.result?.message, resultErrorId)}
        </fieldset>

        <div>
          <label htmlFor={`${baseId}-holder`} className={labelClass}>
            {T.holderLabel}
            {holderRequired && <span className="ml-1 font-normal text-gray-500">{T.required}</span>}
          </label>
          <input
            id={`${baseId}-holder`}
            type="text"
            maxLength={HOLDER_MAX}
            autoComplete="off"
            aria-invalid={errors.holderIdentification ? true : undefined}
            aria-describedby={
              errors.holderIdentification ? `${holderHelpId} ${holderErrorId}` : holderHelpId
            }
            className={inputClass}
            {...register('holderIdentification')}
          />
          <p id={holderHelpId} className="mt-1 text-xs text-gray-500">
            {T.holderHelp}
          </p>
          {fieldError(errors.holderIdentification?.message, holderErrorId)}
        </div>

        <div>
          <label htmlFor={`${baseId}-issued`} className={labelClass}>
            {T.issuedAtLabel}
          </label>
          <input id={`${baseId}-issued`} type="date" className={inputClass} {...register('issuedAt')} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" {...register('hasValidity')} />
            {T.hasValidity}
          </label>
          {hasValidity && (
            <div>
              <label htmlFor={`${baseId}-expires`} className={labelClass}>
                {T.expiresAtLabel}
              </label>
              <input
                id={`${baseId}-expires`}
                type="date"
                min={issuedAt || undefined}
                aria-invalid={errors.expiresAt ? true : undefined}
                aria-describedby={errors.expiresAt ? expiresErrorId : undefined}
                className={inputClass}
                {...register('expiresAt')}
              />
              {fieldError(errors.expiresAt?.message, expiresErrorId)}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${baseId}-notes`} className={labelClass}>
            {T.documentNotesLabel}
            {notesRequired && <span className="ml-1 font-normal text-gray-500">{T.requiredPlural}</span>}
          </label>
          <textarea
            id={`${baseId}-notes`}
            rows={4}
            maxLength={DOCUMENT_NOTES_MAX}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? notesErrorId : undefined}
            className={`${inputClass} resize-y`}
            {...register('notes')}
          />
          {fieldError(errors.notes?.message, notesErrorId)}
        </div>

        {submitError && (
          <p role="alert" className="break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {T.cancel}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03548C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#024266] disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {T.saveReview}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

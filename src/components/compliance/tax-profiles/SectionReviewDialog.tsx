'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Dialog } from '@/components/shared/Dialog';
import { useReviewTaxProfileSection } from '@/hooks/compliance/useComplianceTaxProfiles';
import {
  buildSectionReviewBody,
  createSectionReviewSchema,
  reviewErrorMessage,
  SECTION_NOTES_MAX,
  type SectionReviewFormValues,
} from '@/lib/compliance/sectionReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { TAX_PROFILE_SECTION_TITLES } from '@/lib/labels/taxCompliance';
import type {
  ComplianceTaxProfileResponse,
  SectionReviewResult,
  TaxProfileSection,
} from '@/types/commercial/TaxProfile.types';

interface SectionReviewDialogProps {
  commercialPublicId: string;
  section: TaxProfileSection;
  result: SectionReviewResult;
  // Versión vigente que se veía al abrir el diálogo (RN-13); no viaja a la API.
  shownVersion: number;
  onSaved: (response: ComplianceTaxProfileResponse) => void;
  onClose: () => void;
}

function dialogTitle(result: SectionReviewResult, section: string): string {
  if (result === 'VERIFIED') return T.verifyTitle(section);
  if (result === 'OBSERVED') return T.observeTitle(section);
  return T.notApplicableTitle(section);
}

// Se monta solo mientras está abierto: cada apertura empieza con la nota vacía.
export function SectionReviewDialog({
  commercialPublicId,
  section,
  result,
  shownVersion,
  onSaved,
  onClose,
}: SectionReviewDialogProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useReviewTaxProfileSection(commercialPublicId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SectionReviewFormValues>({
    resolver: zodResolver(createSectionReviewSchema(result)),
    defaultValues: { notes: '' },
  });

  const busy = isSubmitting || mutation.isPending;
  const fieldError = errors.notes?.message;
  const observing = result === 'OBSERVED';

  const onSubmit = async (values: SectionReviewFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      const response = await mutation.mutateAsync({
        section,
        body: buildSectionReviewBody(result, values),
        shownVersion,
      });
      onSaved(response);
      onClose();
    } catch (error) {
      // La nota escrita no se borra: el revisor puede reintentar.
      setSubmitError(reviewErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog
      open
      title={dialogTitle(result, TAX_PROFILE_SECTION_TITLES[section])}
      onClose={onClose}
      dismissible={!busy}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor={fieldId} className="mb-1 block text-sm font-semibold text-gray-700">
          {observing ? T.notesForCommercial : T.notesOptional}
        </label>
        <textarea
          id={fieldId}
          rows={5}
          maxLength={SECTION_NOTES_MAX}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? errorId : undefined}
          className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#03548C] focus:outline-none focus:ring-2 focus:ring-[#03548C]/20"
          {...register('notes')}
        />
        {fieldError && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {fieldError}
          </p>
        )}

        {submitError && (
          <p role="alert" className="mt-3 break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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

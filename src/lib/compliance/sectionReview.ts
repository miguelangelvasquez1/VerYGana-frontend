import { z } from 'zod';
import { readApiError } from '@/lib/api/apiError';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import type { SectionReviewRequest, SectionReviewResult } from '@/types/commercial/TaxProfile.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const SECTION_NOTES_MAX = 1000;

export interface SectionReviewFormValues {
  notes: string;
}

// El resultado lo fija el botón que abrió el diálogo; el esquema depende de él.
export function createSectionReviewSchema(result: SectionReviewResult) {
  return z.object({ notes: z.string() }).superRefine((values, ctx) => {
    const notes = values.notes.trim();
    if (result === 'OBSERVED' && notes === '') {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: T.sectionNotesRequired });
    } else if (notes.length > SECTION_NOTES_MAX) {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: T.notesTooLong });
    }
  });
}

// CA-9: nunca una clave `notes` vacía.
export function buildSectionReviewBody(
  result: SectionReviewResult,
  values: SectionReviewFormValues,
): SectionReviewRequest {
  const notes = values.notes.trim();
  return notes === '' ? { result } : { result, notes };
}

// CA-10: un 400 con `message` se muestra tal cual; todo lo demás, el texto genérico.
export function reviewErrorMessage(error: unknown): string {
  const { status, message } = readApiError(error);
  if (status === 400 && message) return message;
  return T.reviewSaveError;
}

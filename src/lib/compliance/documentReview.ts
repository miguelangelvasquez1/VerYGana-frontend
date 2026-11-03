import { z } from 'zod';
import { readApiError } from '@/lib/api/apiError';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import type {
  CommercialDocumentType,
  DocumentReviewRequest,
  ExpedienteDocument,
} from '@/types/commercial/Expediente.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const HOLDER_MAX = 30;
export const DOCUMENT_NOTES_MAX = 1000;

export type DocumentReviewResultValue = DocumentReviewRequest['result'];

export interface DocumentReviewFormValues {
  result: '' | DocumentReviewResultValue;
  holderIdentification: string;
  issuedAt: string;   // AAAA-MM-DD
  hasValidity: boolean;
  expiresAt: string;  // AAAA-MM-DD; solo cuenta con `hasValidity`
  notes: string;
}

// Igual que `DocumentHolderMatcher` de la API: estos tipos se comparan contra el empresario.
const HOLDER_REQUIRED_TYPES: readonly CommercialDocumentType[] = [
  'RUT',
  'CAMARA_COMERCIO',
  'CERTIFICACION_BANCARIA',
  'CEDULA_REPRESENTANTE',
];

export function requiresHolder(documentType: CommercialDocumentType): boolean {
  return HOLDER_REQUIRED_TYPES.includes(documentType);
}

export function createDocumentReviewSchema(documentType: CommercialDocumentType) {
  return z
    .object({
      result: z.enum(['', 'ACCEPTED', 'OBSERVED', 'REJECTED']),
      holderIdentification: z.string(),
      issuedAt: z.string(),
      hasValidity: z.boolean(),
      expiresAt: z.string(),
      notes: z.string(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: keyof DocumentReviewFormValues, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });

      if (v.result === '') issue('result', T.resultRequired);

      const holder = v.holderIdentification.trim();
      if (v.result === 'ACCEPTED' && requiresHolder(documentType) && holder === '') {
        issue('holderIdentification', T.holderRequired);
      } else if (holder.length > HOLDER_MAX) {
        issue('holderIdentification', T.holderTooLong);
      }

      if (v.hasValidity) {
        if (v.expiresAt === '') issue('expiresAt', T.expiresAtRequired);
        else if (v.issuedAt !== '' && v.expiresAt < v.issuedAt) issue('expiresAt', T.expiryBeforeIssue);
      }

      const notes = v.notes.trim();
      if ((v.result === 'OBSERVED' || v.result === 'REJECTED') && notes === '') {
        issue('notes', T.documentNotesRequired);
      } else if (notes.length > DOCUMENT_NOTES_MAX) {
        issue('notes', T.notesTooLong);
      }
    });
}

// La API guarda tal cual lo que llega y un campo ausente borra el valor anterior: se precarga lo que
// ya tiene el documento (D-6). El resultado y las notas siempre empiezan vacíos.
export function documentReviewDefaults(document: ExpedienteDocument): DocumentReviewFormValues {
  return {
    result: '',
    notes: '',
    holderIdentification: document.holderIdentification ?? '',
    issuedAt: document.issuedAt ?? '',
    hasValidity: document.expiresAt !== null,
    expiresAt: document.expiresAt ?? '',
  };
}

// RN-5: nunca una clave vacía; `expiresAt` solo con la casilla marcada (CA-16).
export function buildDocumentReviewBody(values: DocumentReviewFormValues): DocumentReviewRequest {
  if (values.result === '') throw new Error('La revisión necesita un resultado.');
  const holder = values.holderIdentification.trim();
  const notes = values.notes.trim();
  return {
    result: values.result,
    ...(holder !== '' && { holderIdentification: holder }),
    ...(values.issuedAt !== '' && { issuedAt: values.issuedAt }),
    ...(values.hasValidity && values.expiresAt !== '' && { expiresAt: values.expiresAt }),
    ...(notes !== '' && { notes }),
  };
}

export interface DocumentReviewErrorOutcome {
  message: string;
  // Un 400 suele ser que otro revisor o el empresario cambió el documento: se vuelve a pedir la lista.
  refetch: boolean;
}

// CA-17, RN-6, D-7: un 400 con `message` se muestra tal cual y relee la lista.
export function documentReviewErrorOutcome(error: unknown): DocumentReviewErrorOutcome {
  const { status, message } = readApiError(error);
  if (status === 400 && message) return { message, refetch: true };
  return { message: T.reviewSaveError, refetch: false };
}

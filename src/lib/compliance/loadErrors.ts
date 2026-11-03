import { readApiError } from '@/lib/api/apiError';
import { COMPLIANCE_ACTION_TEXTS as A } from '@/lib/labels/complianceActions';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T, type CaseTabKey } from '@/lib/labels/complianceTaxReview';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// Nunca se muestra el `message` de la API: para un UUID inexistente viene en inglés y con el UUID (D-4).

export type ReviewLoadView = 'not-sent' | 'forbidden' | 'error';

export function reviewLoadView(error: unknown): ReviewLoadView {
  const { status } = readApiError(error);
  if (status === 404) return 'not-sent';
  if (status === 403) return 'forbidden';
  return 'error';
}

export interface TabErrorView {
  message: string;
  retry: boolean;
}

export function tabErrorView(error: unknown, tab: CaseTabKey): TabErrorView {
  const { status } = readApiError(error);
  if (status === 403) return { message: T.forbidden, retry: false };
  if (tab === 'tax-profile' && status === 404) return { message: T.reviewNotSent, retry: false };
  if (status === 404 || status === 400) return { message: T.commercialNotFound, retry: false };
  return { message: T.tabLoadError(tab), retry: true };
}

export type RequestDetailView = 'not-found' | 'forbidden' | 'error';

// Un 400 en el detalle es un id mal formado: se trata como inexistente (CA-6).
export function requestDetailLoadView(error: unknown): RequestDetailView {
  const { status } = readApiError(error);
  if (status === 404 || status === 400) return 'not-found';
  if (status === 403) return 'forbidden';
  return 'error';
}

// Mensaje de un diálogo de acción. Solo un 400 muestra el `message` de la API tal cual (CA-26).
export function actionErrorMessage(error: unknown): string {
  const { status, message } = readApiError(error);
  if (status === 400 && message) return message;
  if (status === 403) return A.forbidden;
  return A.saveError;
}

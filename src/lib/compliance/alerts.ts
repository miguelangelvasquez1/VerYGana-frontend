import { z } from 'zod';

import { formatCents } from '@/lib/money/cents';
import type { Alert, AlertReviewRequest } from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// `dataUsedJson` solo se pinta: no se envía, no se registra ni va a la URL (RN-13).

export interface DataUsedRow {
  key: string;
  value: string;
}

function displayValue(key: string, value: unknown): string {
  if (key.endsWith('Cents') && typeof value === 'number' && Number.isFinite(value)) return formatCents(value);
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// `null` si el texto no es JSON o no es un objeto: la pantalla muestra "No pudimos leer los datos".
export function parseDataUsed(json: string): DataUsedRow[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  return Object.entries(parsed).map(([key, value]) => ({ key, value: displayValue(key, value) }));
}

export function alertOriginLabel(alert: Pick<Alert, 'ruleCode' | 'ruleVersion'>): string {
  return alert.ruleCode ? `Regla ${alert.ruleCode} v${alert.ruleVersion ?? 1}` : 'Evento del expediente';
}

export const alertReviewSchema = z.object({
  notes: z.string().trim().min(1, 'Este campo es obligatorio.').max(1000, 'Máximo 1000 caracteres.'),
});
export type AlertReviewFormValues = z.infer<typeof alertReviewSchema>;

export function buildAlertReviewBody(values: AlertReviewFormValues): AlertReviewRequest {
  return { notes: values.notes.trim() };
}

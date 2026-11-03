import { z } from 'zod';
import { readApiError } from '@/lib/api/apiError';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';
import type { RespondRequest } from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const RESPONSE_MESSAGE_MAX = 2000;

export const respondSchema = z
  .object({
    message: z.string().max(RESPONSE_MESSAGE_MAX, T.messageMax),
    // Solo los documentos cargados en esta respuesta (RN-8).
    documents: z.array(z.object({ id: z.number(), name: z.string() })),
  })
  .superRefine((values, ctx) => {
    if (values.message.trim() === '' && values.documents.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['message'], message: T.emptyResponse });
    }
  });

export type RespondFormValues = z.input<typeof respondSchema>;

export function emptyRespondValues(): RespondFormValues {
  return { message: '', documents: [] };
}

// CA-10: nunca una clave vacía.
export function buildRespondBody(values: RespondFormValues): RespondRequest {
  const message = values.message.trim();
  const documentIds = [...new Set(values.documents.map((d) => d.id))];
  return {
    ...(message !== '' && { message }),
    ...(documentIds.length > 0 && { documentIds }),
  };
}

// RN-8: al subir un documento a la respuesta, el que reemplaza (ya no vigente) sale de la lista
// para no enviar un SUPERSEDED.
export function addUploadedDocument<T extends { id: number }>(
  prev: readonly T[],
  uploaded: T,
  replacedId: number | null,
): T[] {
  const kept = prev.filter((d) => d.id !== replacedId);
  return kept.some((d) => d.id === uploaded.id) ? kept : [...kept, uploaded];
}

// CA-15: un 400 con `message` se muestra tal cual y la solicitud se vuelve a pedir
// (suele ser que ya no espera respuesta). Todo lo demás, el texto genérico.
export function respondErrorOutcome(err: unknown): { message: string; refetch: boolean } {
  const { status, message } = readApiError(err);
  if (status === 400 && message) return { message, refetch: true };
  return { message: T.respondFailed, refetch: false };
}

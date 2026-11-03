import { z } from 'zod';

import type { CommercialDocumentType } from '@/types/commercial/Expediente.types';
import type {
  CancelInformationRequest,
  CreateInformationRequest,
  InformationRequestStatus,
  InformationRequestTrigger,
  ItemInput,
  RequestItemType,
  ReviewInformationRequest,
} from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const REQUEST_TRIGGERS = [
  'DOCUMENT_EXPIRED',
  'ACTIVITY_CHANGE',
  'ESTABLISHMENT_CHANGE',
  'MATERIAL_OPERATION_INCREASE',
  'NEW_REQUIREMENT',
  'INCONSISTENCY',
  'INCIDENT',
  'RISK',
  'MISSING_MANIFESTATION',
  'EXPRESS_REFUSAL',
] as const satisfies readonly InformationRequestTrigger[];

export const REQUEST_ITEM_TYPES = ['DOCUMENT', 'FIELD', 'CLARIFICATION'] as const satisfies readonly RequestItemType[];

export const REQUEST_DOCUMENT_TYPES = [
  'RUT',
  'CAMARA_COMERCIO',
  'CEDULA_REPRESENTANTE',
  'CERTIFICACION_BANCARIA',
  'PERMISO_SECTORIAL',
  'MARCA_REGISTRADA',
  'OTRO',
] as const satisfies readonly CommercialDocumentType[];

const REQUIRED = 'Este campo es obligatorio.';
const tooLong = (max: number) => `Máximo ${max} caracteres.`;

function requiredText(max: number) {
  return z.string().trim().min(1, REQUIRED).max(max, tooLong(max));
}

function optionalText(max: number) {
  return z.string().trim().max(max, tooLong(max));
}

const itemSchema = z
  .object({
    itemType: z.enum(REQUEST_ITEM_TYPES),
    documentType: z.union([z.enum(REQUEST_DOCUMENT_TYPES), z.literal('')]),
    fieldPath: optionalText(100),
    establishmentId: z.string(),
    description: requiredText(500),
    acceptableResponse: optionalText(500),
  })
  .superRefine((item, ctx) => {
    if (item.itemType === 'DOCUMENT' && !item.documentType) {
      ctx.addIssue({ code: 'custom', path: ['documentType'], message: 'Indica qué tipo de documento se pide.' });
    }
    if (item.itemType === 'FIELD' && !item.fieldPath) {
      ctx.addIssue({ code: 'custom', path: ['fieldPath'], message: 'Indica qué campo se pide actualizar.' });
    }
  });

export const createRequestSchema = z.object({
  commercialPublicId: z.string(),
  trigger: z.enum(REQUEST_TRIGGERS),
  reason: requiredText(1000),
  relationToOperation: requiredText(1000),
  dueDate: z.string(),
  alertId: z.number().nullable(),
  items: z.array(itemSchema).min(1, 'Agrega al menos un ítem.'),
});

export type CreateRequestFormValues = z.infer<typeof createRequestSchema>;
export type RequestItemFormValues = CreateRequestFormValues['items'][number];

export function emptyRequestItem(): RequestItemFormValues {
  return {
    itemType: 'CLARIFICATION',
    documentType: '',
    fieldPath: '',
    establishmentId: '',
    description: '',
    acceptableResponse: '',
  };
}

function buildItem(item: RequestItemFormValues): ItemInput {
  const body: ItemInput = { itemType: item.itemType, description: item.description.trim() };
  if (item.itemType === 'DOCUMENT') {
    if (item.documentType) body.documentType = item.documentType;
    const establishmentId = Number(item.establishmentId);
    if (item.establishmentId.trim() && Number.isInteger(establishmentId)) body.establishmentId = establishmentId;
  }
  if (item.itemType === 'FIELD' && item.fieldPath.trim()) body.fieldPath = item.fieldPath.trim();
  if (item.acceptableResponse.trim()) body.acceptableResponse = item.acceptableResponse.trim();
  return body;
}

// Sin claves vacías: la API trata una cadena vacía como un dato, no como ausencia.
export function buildCreateRequestBody(values: CreateRequestFormValues): CreateInformationRequest {
  const body: CreateInformationRequest = {
    commercialPublicId: values.commercialPublicId,
    trigger: values.trigger,
    reason: values.reason.trim(),
    relationToOperation: values.relationToOperation.trim(),
    items: values.items.map(buildItem),
  };
  if (values.dueDate.trim()) body.dueDate = values.dueDate.trim();
  if (values.alertId !== null) body.alertId = values.alertId;
  return body;
}

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// El UUID del requerimiento idéntico solo viene dentro del texto del 400 (RN-2).
export function extractDuplicateRequestId(message: string | undefined): string | null {
  return message?.match(UUID_IN_TEXT)?.[0] ?? null;
}

export const reviewRequestSchema = z
  .object({
    result: z.enum(['SUFFICIENT', 'INSUFFICIENT']),
    notes: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (value.result === 'INSUFFICIENT' && !value.notes) {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Indica qué falta para que sea suficiente.' });
    }
  });

export type ReviewRequestFormValues = z.infer<typeof reviewRequestSchema>;

export function buildReviewBody(values: ReviewRequestFormValues): ReviewInformationRequest {
  const notes = values.notes.trim();
  return notes ? { result: values.result, notes } : { result: values.result };
}

export const cancelRequestSchema = z.object({ reason: requiredText(1000) });
export type CancelRequestFormValues = z.infer<typeof cancelRequestSchema>;

export function buildCancelBody(values: CancelRequestFormValues): CancelInformationRequest {
  return { reason: values.reason.trim() };
}

export interface RequestActions {
  review: boolean;
  cancel: boolean;
  finding: boolean;
}

export function requestActions(status: InformationRequestStatus): RequestActions {
  const open = status === 'OPEN' || status === 'RESPONDED' || status === 'OBSERVED';
  return { review: status === 'RESPONDED', cancel: open, finding: open };
}

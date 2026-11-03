import { z } from 'zod';
import { readApiError } from '@/lib/api/apiError';
import { EXPEDIENTE_TEXTS as T } from '@/lib/labels/expedienteRequests';
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '@/services/commercial/OnboardingService';
import type {
  CommercialDocumentType,
  DocumentUploadPermission,
  ExpedienteDocument,
  ExpedienteDocumentUploadRequest,
} from '@/types/commercial/Expediente.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export type UploadStage = 'validate' | 'prepare' | 'upload' | 'confirm';

// El mensaje es siempre un texto seguro para mostrar: nunca la URL firmada ni la configuración
// de axios (P-16). La causa solo se guarda en prepare y confirm, para leer `status` y `message`.
export class ExpedienteUploadError extends Error {
  readonly stage: UploadStage;

  constructor(stage: UploadStage, message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ExpedienteUploadError';
    this.stage = stage;
  }
}

// RN-3: el tamaño se comprueba antes que el formato, como en el onboarding.
export function validateExpedienteFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return T.fileTooLarge;
  if (!ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type)) return T.formatNotAllowed;
  return null;
}

export interface ExpedienteUploadInput {
  file: File;
  documentType: CommercialDocumentType;
  replacesDocumentId?: number | null;
}

export interface ExpedienteUploadDeps {
  prepare: (body: ExpedienteDocumentUploadRequest) => Promise<DocumentUploadPermission>;
  put: (uploadUrl: string, file: File) => Promise<void>;
  confirm: (documentId: number) => Promise<ExpedienteDocument>;
}

// RN-4: preparar, subir y confirmar. Cada intento empieza en preparar; nunca reanuda un
// documento anterior.
export async function runExpedienteUpload(
  { file, documentType, replacesDocumentId }: ExpedienteUploadInput,
  deps: ExpedienteUploadDeps,
): Promise<ExpedienteDocument> {
  const invalid = validateExpedienteFile(file);
  if (invalid) throw new ExpedienteUploadError('validate', invalid);

  let permission: DocumentUploadPermission;
  try {
    permission = await deps.prepare({
      documentType,
      originalFileName: file.name,
      // validateExpedienteFile ya comprobó que es uno de los tres tipos permitidos.
      contentType: file.type as ExpedienteDocumentUploadRequest['contentType'],
      sizeBytes: file.size,
      ...(replacesDocumentId != null && { replacesDocumentId }),
    });
  } catch (cause) {
    throw new ExpedienteUploadError('prepare', T.uploadFailed, cause);
  }

  try {
    await deps.put(permission.permission.uploadUrl, file);
  } catch {
    // Sin causa: el error del navegador podría arrastrar la URL firmada.
    throw new ExpedienteUploadError('upload', T.uploadFailed);
  }

  try {
    return await deps.confirm(permission.documentId);
  } catch (cause) {
    throw new ExpedienteUploadError('confirm', T.uploadFailed, cause);
  }
}

// Un 400 de la API en preparar o confirmar trae un `message` pensado para el usuario.
function apiMessageOf(err: ExpedienteUploadError): { status?: number; message?: string } {
  if (err.stage !== 'prepare' && err.stage !== 'confirm') return {};
  return readApiError(err.cause);
}

export function uploadErrorMessage(err: unknown): string {
  if (!(err instanceof ExpedienteUploadError)) return T.uploadFailed;
  if (err.stage === 'validate') return err.message;
  const { status, message } = apiMessageOf(err);
  return status === 400 && message ? message : T.uploadFailed;
}

// Un 400 al preparar o confirmar suele ser "ya no está vigente": la lista está vieja.
export function shouldRefetchExpedienteAfterError(err: unknown): boolean {
  if (!(err instanceof ExpedienteUploadError)) return false;
  return apiMessageOf(err).status === 400;
}

export interface ExpedienteUploadFormValues {
  documentType: string;
  file: File | undefined;
}

// Esquema del diálogo de carga. El archivo se valida al elegirlo (CA-4).
export function createExpedienteUploadSchema(allowedTypes: readonly CommercialDocumentType[]) {
  return z.object({
    documentType: z
      .string()
      .refine((value) => (allowedTypes as readonly string[]).includes(value), {
        error: T.selectDocumentType,
      }),
    file: z.custom<File | undefined>().superRefine((file, ctx) => {
      if (!(file instanceof File)) {
        ctx.addIssue({ code: 'custom', message: T.selectFile });
        return;
      }
      const invalid = validateExpedienteFile(file);
      if (invalid) ctx.addIssue({ code: 'custom', message: invalid });
    }),
  });
}

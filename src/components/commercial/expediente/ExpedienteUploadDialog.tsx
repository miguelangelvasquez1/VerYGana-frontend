'use client';

import { useEffect, useId, useMemo, useRef, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Dialog } from '@/components/shared/Dialog';
import { useExpedienteUpload } from '@/hooks/commercial/useExpediente';
import {
  createExpedienteUploadSchema,
  type ExpedienteUploadFormValues,
  uploadErrorMessage,
} from '@/lib/expediente/uploadFlow';
import { EXPEDIENTE_TEXTS as T } from '@/lib/labels/expedienteRequests';
import { COMMERCIAL_DOCUMENT_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import type { CommercialDocumentType, ExpedienteDocument } from '@/types/commercial/Expediente.types';

export type ExpedienteUploadTarget =
  | { kind: 'replace'; document: ExpedienteDocument }
  | { kind: 'add'; types: readonly CommercialDocumentType[] }
  // Carga desde un ítem de una solicitud: reemplaza el vigente del tipo si lo hay (RN-8).
  | { kind: 'item'; documentType: CommercialDocumentType; replaces: ExpedienteDocument | null };

interface ExpedienteUploadDialogProps {
  open: boolean;
  onClose: () => void;
  target: ExpedienteUploadTarget;
  onUploaded: (document: ExpedienteDocument) => void;
}

function allowedTypesOf(target: ExpedienteUploadTarget): readonly CommercialDocumentType[] {
  if (target.kind === 'replace') return [target.document.documentType];
  if (target.kind === 'add') return target.types;
  return [target.documentType];
}

function initialTypeOf(target: ExpedienteUploadTarget): string {
  if (target.kind === 'replace') return target.document.documentType;
  if (target.kind === 'item') return target.documentType;
  return '';
}

function replacedDocumentOf(target: ExpedienteUploadTarget): ExpedienteDocument | null {
  if (target.kind === 'replace') return target.document;
  if (target.kind === 'item') return target.replaces;
  return null;
}

function titleOf(target: ExpedienteUploadTarget): string {
  if (target.kind === 'replace') {
    return T.replaceTitle(COMMERCIAL_DOCUMENT_TYPE_LABELS[target.document.documentType]);
  }
  if (target.kind === 'item') return T.itemTitle(COMMERCIAL_DOCUMENT_TYPE_LABELS[target.documentType]);
  return T.addTitle;
}

// Carga de un documento al expediente en tres pasos (RN-4). El archivo se valida al elegirlo (CA-4)
// y se conserva si la subida falla (CA-5).
export function ExpedienteUploadDialog({ open, onClose, target, onUploaded }: ExpedienteUploadDialogProps) {
  const fieldId = useId();
  const typeId = `${fieldId}-type`;
  const fileId = `${fieldId}-file`;
  const upload = useExpedienteUpload();
  // Guarda síncrona contra el doble envío.
  const submittingRef = useRef(false);

  const allowedTypes = allowedTypesOf(target);
  const allowedKey = allowedTypes.join(',');
  const schema = useMemo(
    () => createExpedienteUploadSchema(allowedKey === '' ? [] : (allowedKey.split(',') as CommercialDocumentType[])),
    [allowedKey],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpedienteUploadFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { documentType: initialTypeOf(target), file: undefined },
  });

  // Cada vez que se abre empieza limpio.
  const { reset: resetUpload } = upload;
  const initialType = initialTypeOf(target);
  useEffect(() => {
    if (!open) return;
    reset({ documentType: initialType, file: undefined });
    resetUpload();
    submittingRef.current = false;
  }, [open, initialType, reset, resetUpload]);

  const isPending = upload.isPending;
  const replaced = replacedDocumentOf(target);
  const typeError = errors.documentType?.message;
  const fileError = errors.file?.message;

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue('file', event.target.files?.[0], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (values: ExpedienteUploadFormValues) => {
    if (submittingRef.current || !values.file) return;
    const documentType = allowedTypes.find((type) => type === values.documentType);
    if (!documentType) return;
    submittingRef.current = true;
    try {
      const document = await upload.mutateAsync({
        file: values.file,
        documentType,
        replacesDocumentId: replaced?.id ?? null,
      });
      onUploaded(document);
    } catch {
      // El error se muestra desde el estado de la mutación; el archivo se conserva (CA-5).
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open={open} title={titleOf(target)} onClose={onClose} dismissible={!isPending}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {replaced && <p className="text-sm text-gray-700">{T.replaceNotice}</p>}

        {target.kind === 'add' && (
          <div className="flex flex-col gap-1">
            <label htmlFor={typeId} className="text-sm font-semibold text-gray-700">
              {T.documentTypeLabel}
            </label>
            <select
              id={typeId}
              disabled={isPending}
              aria-invalid={typeError ? true : undefined}
              aria-describedby={typeError ? `${typeId}-error` : undefined}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#03548C] focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 disabled:opacity-60"
              {...register('documentType')}
            >
              <option value="">{T.selectDocumentType}</option>
              {target.types.map((type) => (
                <option key={type} value={type}>
                  {COMMERCIAL_DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {typeError && (
              <p id={`${typeId}-error`} role="alert" className="text-xs text-red-600">
                {typeError}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={fileId} className="text-sm font-semibold text-gray-700">
            {T.fileLabel}
          </label>
          <input
            id={fileId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={isPending}
            onChange={onFileChange}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={fileError ? `${fileId}-hint ${fileId}-error` : `${fileId}-hint`}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-60"
          />
          <p id={`${fileId}-hint`} className="text-xs text-gray-500">
            {T.fileHelp}
          </p>
          {fileError && (
            <p id={`${fileId}-error`} role="alert" className="text-xs text-red-600">
              {fileError}
            </p>
          )}
        </div>

        {upload.isError && (
          <p role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {uploadErrorMessage(upload.error)}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {T.cancel}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03548C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#024266] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isPending ? T.uploading : T.upload}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

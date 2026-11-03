'use client';

import { useEffect, useId, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useRespondInformationRequest } from '@/hooks/commercial/useInformationRequests';
import {
  RESPONSE_MESSAGE_MAX,
  buildRespondBody,
  emptyRespondValues,
  respondErrorOutcome,
  respondSchema,
  type RespondFormValues,
} from '@/lib/informationRequests/respond';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';

interface RespondFormProps {
  publicId: string;
  // Documentos de esta respuesta: su estado vive en el detalle, que los carga desde los ítems (RN-8).
  documents: RespondFormValues['documents'];
  onDocumentsChange: (next: RespondFormValues['documents']) => void;
  // Avisa al detalle si se está enviando, para deshabilitar "Cargar documento" de los ítems.
  onBusyChange: (busy: boolean) => void;
  onResponded: () => void;
  // Un 400 por estado: el detalle conserva el mensaje aunque este formulario se desmonte (CA-15).
  onRejected: (message: string | null) => void;
}

const secondaryButton =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';

// Respuesta del empresario: aclaración y/o documentos del expediente (RN-6, RN-8).
export function RespondForm({
  publicId,
  documents,
  onDocumentsChange,
  onBusyChange,
  onResponded,
  onRejected,
}: RespondFormProps) {
  const fieldId = useId();
  const counterId = `${fieldId}-counter`;
  const errorId = `${fieldId}-error`;
  const respond = useRespondInformationRequest(publicId);
  // Guarda síncrona contra el doble envío (CA-16).
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RespondFormValues>({
    resolver: zodResolver(respondSchema),
    defaultValues: { ...emptyRespondValues(), documents },
  });

  const message = useWatch({ control, name: 'message' }) ?? '';
  const busy = isSubmitting || respond.isPending;
  const messageError = errors.message?.message;

  // El detalle es dueño de los documentos; el formulario los refleja para validar y enviar.
  useEffect(() => {
    setValue('documents', documents, { shouldDirty: true });
    if (isSubmitted) void trigger('message');
  }, [documents, setValue, trigger, isSubmitted]);

  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  const setDocuments = (next: RespondFormValues['documents']) => onDocumentsChange(next);

  const onSubmit = async (values: RespondFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    onRejected(null);
    try {
      await respond.mutateAsync(buildRespondBody(values));
      onResponded();
    } catch (err) {
      // El texto y los documentos se conservan (CA-15). Un 400 con mensaje lo muestra el detalle.
      const outcome = respondErrorOutcome(err);
      if (outcome.refetch) onRejected(outcome.message);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-semibold text-gray-700">
          {T.messageLabel}
        </label>
        <textarea
          id={fieldId}
          rows={5}
          maxLength={RESPONSE_MESSAGE_MAX}
          disabled={busy}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={messageError ? `${counterId} ${errorId}` : counterId}
          className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#03548C] focus:outline-none focus:ring-2 focus:ring-[#03548C]/20 disabled:opacity-60"
          {...register('message')}
        />
        <p id={counterId} aria-live="polite" className="text-right text-xs text-gray-500">
          {T.messageCounter(message.length)}
        </p>
        {messageError && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {messageError}
          </p>
        )}
      </div>

      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
            >
              <span className="min-w-0 break-words text-sm text-gray-800">{doc.name}</span>
              <button
                type="button"
                aria-label={T.removeLabel(doc.name)}
                disabled={busy}
                onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                className={secondaryButton}
              >
                {T.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      {respond.isError && !respondErrorOutcome(respond.error).refetch && (
        <p role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {respondErrorOutcome(respond.error).message}
        </p>
      )}

      <div className="flex sm:justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#024266] disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-2 inline h-4 w-4 animate-spin align-[-2px]" aria-hidden="true" />}
          {T.submit}
        </button>
      </div>
    </form>
  );
}

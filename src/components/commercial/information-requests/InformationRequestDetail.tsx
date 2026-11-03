'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import type { ExpedienteUploadTarget } from '@/components/commercial/expediente/ExpedienteUploadDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useExpediente } from '@/hooks/commercial/useExpediente';
import { useInformationRequest } from '@/hooks/commercial/useInformationRequests';
import { readApiError } from '@/lib/api/apiError';
import { currentDocumentOfType, documentNameById } from '@/lib/expediente/expediente';
import {
  canRespond,
  isUuid,
  latestInsufficientReview,
  needsToneBanner,
} from '@/lib/informationRequests/requests';
import {
  EXPEDIENTE_TEXTS as E,
  INFORMATION_REQUEST_TEXTS as T,
} from '@/lib/labels/expedienteRequests';
import {
  COMMERCIAL_DOCUMENT_TYPE_LABELS,
  REQUEST_STATUS_LABELS_COMMERCIAL,
  TRIGGER_LABELS,
} from '@/lib/labels/taxCompliance';
import { addUploadedDocument } from '@/lib/informationRequests/respond';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';
import type { RequestItem } from '@/types/compliance/InformationRequest.types';
import { RequestTimeline } from './RequestTimeline';
import { RespondForm } from './RespondForm';

const ExpedienteUploadDialog = dynamic(
  () => import('@/components/commercial/expediente/ExpedienteUploadDialog').then((m) => m.ExpedienteUploadDialog),
  { ssr: false },
);

type ResponseDocuments = { id: number; name: string }[];

interface InformationRequestDetailProps {
  requestPublicId: string;
  // false dentro del onboarding: los documentos se cargan después del registro (RN-9).
  canUploadDocuments: boolean;
  back: { href: string } | { onBack: () => void };
}

const secondaryButton =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';

const backClass = 'text-sm font-semibold text-[#03548C] underline underline-offset-2 hover:text-[#023e69]';

function BackLink({ back, label }: { back: InformationRequestDetailProps['back']; label: string }) {
  return 'href' in back ? (
    <Link href={back.href} className={backClass}>
      {label}
    </Link>
  ) : (
    <button type="button" onClick={back.onBack} className={backClass}>
      {label}
    </button>
  );
}

// Detalle de una solicitud: qué se pide, por qué, la conversación y el formulario de respuesta.
export function InformationRequestDetail({
  requestPublicId,
  canUploadDocuments,
  back,
}: InformationRequestDetailProps) {
  const validId = isUuid(requestPublicId);
  const query = useInformationRequest(requestPublicId);
  const expediente = useExpediente();
  // El mensaje de RN-7 se queda aunque la consulta se vuelva a pedir.
  const [justResponded, setJustResponded] = useState(false);
  // Documentos de la respuesta en curso: los cargan los ítems y los lista el formulario (RN-8).
  const [documents, setDocuments] = useState<ResponseDocuments>([]);
  // Mensaje de la API tras un 400 por estado: el formulario se desmonta al releer, el aviso se queda.
  const [rejection, setRejection] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<ExpedienteUploadTarget | null>(null);

  const documentNames = useMemo(() => documentNameById(expediente.data ?? []), [expediente.data]);

  // CA-17: un valor que no es UUID no llega a la API.
  const notFoundView = (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-700">{T.notFound}</p>
      <BackLink back={back} label={'href' in back ? T.backToList : T.backToListShort} />
    </div>
  );

  if (!validId) return notFoundView;

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    const { status } = readApiError(query.error);
    if (status === 404) return notFoundView;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <p className="text-sm font-semibold text-red-700">
          {status === 403 ? T.detailForbidden : T.detailError}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {status !== 403 && (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              {T.retry}
            </button>
          )}
          <BackLink back={back} label={'href' in back ? T.backToList : T.backToListShort} />
        </div>
      </div>
    );
  }

  const request = query.data;
  const status = REQUEST_STATUS_LABELS_COMMERCIAL[request.status];
  const awaiting = canRespond(request.status);
  const insufficient = request.status === 'OBSERVED' ? latestInsufficientReview(request) : null;
  const hasUploadableItems =
    canUploadDocuments && awaiting && request.items.some((i) => i.itemType === 'DOCUMENT' && i.documentType);

  const openUpload = (item: RequestItem) => {
    if (!item.documentType) return;
    setUploadTarget({
      kind: 'item',
      documentType: item.documentType,
      replaces: currentDocumentOfType(expediente.data ?? [], item.documentType),
    });
  };

  const onUploaded = (document: ExpedienteDocument) => {
    const replacedId = uploadTarget?.kind === 'item' ? (uploadTarget.replaces?.id ?? null) : null;
    setUploadTarget(null);
    setRejection(null);
    setDocuments((prev) => addUploadedDocument(prev, { id: document.id, name: document.originalFileName }, replacedId));
  };

  return (
    <div className="flex flex-col gap-5">
      <BackLink back={back} label={'href' in back ? T.backToList : T.backToListShort} />

      <header className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={status.label} tone={status.tone} />
          <span className="text-sm font-semibold text-gray-900">{TRIGGER_LABELS[request.trigger]}</span>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-gray-500 sm:flex-row sm:gap-4">
          <span>{T.sentOn(formatBogotaDateTime(request.issuedAt))}</span>
          {request.dueDate && <span>{T.dueBefore(formatPlainDate(request.dueDate))}</span>}
        </div>
      </header>

      {needsToneBanner(request.trigger) && (
        <p role="note" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          {T.toneBanner}
        </p>
      )}

      <section className="flex flex-col gap-3" aria-labelledby={`${requestPublicId}-ask`}>
        <h2 id={`${requestPublicId}-ask`} className="text-base font-bold text-gray-900">
          {T.whatWeAsk}
        </h2>
        <ul className="flex flex-col gap-3">
          {request.items.map((item, index) => (
            <li key={index} className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3">
              <p className="whitespace-pre-line break-words text-sm font-medium text-gray-900">{item.description}</p>
              {item.acceptableResponse && (
                <p className="break-words text-sm text-gray-600">{T.expectedResponse(item.acceptableResponse)}</p>
              )}
              {item.itemType === 'DOCUMENT' && item.documentType && (
                <p className="text-sm font-semibold text-gray-700">
                  {COMMERCIAL_DOCUMENT_TYPE_LABELS[item.documentType]}
                </p>
              )}
              {item.itemType === 'DOCUMENT' && !canUploadDocuments && (
                <p className="text-sm text-gray-600">{T.uploadAfterRegistration}</p>
              )}
              {item.itemType === 'DOCUMENT' && item.documentType && canUploadDocuments && awaiting && (
                <div>
                  <button
                    type="button"
                    onClick={() => openUpload(item)}
                    disabled={sending || !expediente.isSuccess}
                    className={secondaryButton}
                  >
                    {T.loadDocument}
                  </button>
                </div>
              )}
              {item.linkedDocumentId !== null && (
                <p className="text-sm text-gray-600">{T.linkedDocument}</p>
              )}
            </li>
          ))}
        </ul>
        {hasUploadableItems && expediente.isError && (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <p className="text-sm text-red-600">{E.loadErrorShort}</p>
            <button type="button" onClick={() => expediente.refetch()} className={secondaryButton}>
              {E.retry}
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby={`${requestPublicId}-why`}>
        <h2 id={`${requestPublicId}-why`} className="text-base font-bold text-gray-900">
          {T.why}
        </h2>
        <p className="whitespace-pre-line break-words text-sm text-gray-800">{request.reason}</p>
        <p className="whitespace-pre-line break-words text-sm text-gray-600">{request.relationToOperation}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby={`${requestPublicId}-conversation`}>
        <h2 id={`${requestPublicId}-conversation`} className="text-base font-bold text-gray-900">
          {T.conversation}
        </h2>
        <RequestTimeline request={request} documentNames={documentNames} />
      </section>

      {justResponded && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {T.responseReceived}
        </p>
      )}

      {rejection && (
        <p role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {rejection}
        </p>
      )}

      {request.status === 'RESPONDED' && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{T.inReview}</p>
      )}

      {insufficient && (
        <div className="flex flex-col gap-1 rounded-xl border border-orange-300 bg-orange-50 p-4">
          <p className="text-sm font-bold text-orange-900">{T.reviewInsufficient}</p>
          {insufficient.notes && (
            <p className="whitespace-pre-line break-words text-sm text-orange-900">{insufficient.notes}</p>
          )}
        </div>
      )}

      {awaiting && (
        <RespondForm
          publicId={requestPublicId}
          documents={documents}
          onDocumentsChange={setDocuments}
          onBusyChange={setSending}
          onResponded={() => {
            setJustResponded(true);
            setRejection(null);
            setDocuments([]);
          }}
          onRejected={setRejection}
        />
      )}

      {/* Fuera del formulario: un submit del diálogo burbujea por el portal de React hasta el formulario. */}
      {uploadTarget && (
        <ExpedienteUploadDialog
          open
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={onUploaded}
        />
      )}
    </div>
  );
}

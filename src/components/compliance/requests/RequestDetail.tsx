'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ClipboardList } from 'lucide-react';

import { FindingDialog } from '@/components/compliance/findings/FindingDialog';
import { RequestCancelDialog } from '@/components/compliance/requests/RequestCancelDialog';
import { RequestCommunications } from '@/components/compliance/requests/RequestCommunications';
import { RequestReviewDialog } from '@/components/compliance/requests/RequestReviewDialog';
import { Btn, EmptyState, ErrorState } from '@/components/compliance/ui/primitives';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useCaseDocuments } from '@/hooks/compliance/useComplianceCase';
import { useComplianceRequest } from '@/hooks/compliance/useComplianceRequests';
import { useOpenCaseDocument } from '@/hooks/compliance/useOpenCaseDocument';
import { requestActions } from '@/lib/compliance/informationRequestForm';
import { requestDetailLoadView } from '@/lib/compliance/loadErrors';
import { casePath, INFORMATION_REQUESTS_PATH } from '@/lib/compliance/routes';
import { buildTimeline, isUuid } from '@/lib/informationRequests/requests';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import {
  COMMERCIAL_DOCUMENT_TYPE_LABELS,
  REQUEST_ITEM_TYPE_LABELS,
  REQUEST_STATUS_LABELS_COMPLIANCE,
  TRIGGER_LABELS,
} from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { InformationRequest, RequestResponse } from '@/types/compliance/InformationRequest.types';

type Dialogs = 'review' | 'cancel' | 'finding' | null;

// Adjuntos de una respuesta: se abren con la URL firmada de la caché de documentos del caso.
function ResponseAttachments({ commercialPublicId, response }: { commercialPublicId: string; response: RequestResponse }) {
  const documents = useCaseDocuments(commercialPublicId, response.documentIds.length > 0);
  const { open, openingId } = useOpenCaseDocument(documents);
  if (response.documentIds.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-cmp-slate">
      <span>{U.attachments(response.documentIds.length)}</span>
      {response.documentIds.map((documentId) => {
        const documentType = documents.data?.find((d) => d.id === documentId)?.documentType;
        return (
        <button
          key={documentId}
          type="button"
          onClick={() => void open(documentId)}
          disabled={openingId !== null}
          className="rounded border border-cmp-rule px-2 py-0.5 font-medium text-cmp-azul hover:bg-cmp-rule-soft disabled:opacity-50"
        >
          {documentType ? U.attachmentOf(COMMERCIAL_DOCUMENT_TYPE_LABELS[documentType]) : U.attachmentUnknown}
        </button>
        );
      })}
    </div>
  );
}

function RequestBody({ request }: { request: InformationRequest }) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const status = REQUEST_STATUS_LABELS_COMPLIANCE[request.status];
  const actions = requestActions(request.status);
  const timeline = buildTimeline(request);
  const close = () => setDialog(null);

  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b border-cmp-rule pb-4">
        <Link href={INFORMATION_REQUESTS_PATH} className="text-sm text-cmp-azul hover:underline">
          {U.backToRequests}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words text-[22px] font-semibold leading-tight text-cmp-ink">
            {request.companyName}
          </h1>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <p className="text-sm text-cmp-slate">
          {TRIGGER_LABELS[request.trigger]}
          {request.ruleCode ? ` · ${U.ruleLabel(request.ruleCode, request.ruleVersion)}` : ''}
        </p>
        <p className="text-sm">
          <Link href={casePath(request.commercialPublicId, 'requests')} className="text-cmp-azul hover:underline">
            {U.backToCase}
          </Link>
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.review && (
            <Btn variant="primary" onClick={() => setDialog('review')}>
              {U.actions.review}
            </Btn>
          )}
          {actions.finding && (
            <Btn variant="quiet" onClick={() => setDialog('finding')}>
              {U.actions.finding}
            </Btn>
          )}
          {actions.cancel && (
            <Btn variant="reject" onClick={() => setDialog('cancel')}>
              {U.actions.cancel}
            </Btn>
          )}
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-4 text-sm lg:grid-cols-2">
        <div>
          <dt className="font-semibold text-cmp-ink">{U.reasonLabel}</dt>
          <dd className="whitespace-pre-line break-words text-cmp-slate">{request.reason}</dd>
        </div>
        <div>
          <dt className="font-semibold text-cmp-ink">{U.relationLabel}</dt>
          <dd className="whitespace-pre-line break-words text-cmp-slate">{request.relationToOperation}</dd>
        </div>
        <div>
          <dt className="font-semibold text-cmp-ink">{U.issuedByLabel}</dt>
          <dd className="text-cmp-slate">
            {request.issuedBySystem ? U.system : U.compliance} · {formatBogotaDateTime(request.issuedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-cmp-ink">{U.dueLabel}</dt>
          <dd className="text-cmp-slate">{request.dueDate ? formatPlainDate(request.dueDate) : U.dash}</dd>
        </div>
      </dl>
      {request.closedAt && (
        <p className="text-sm text-cmp-slate">{U.closedOn(formatBogotaDateTime(request.closedAt))}</p>
      )}
      {request.closingNotes && (
        <p className="whitespace-pre-line break-words text-sm text-cmp-slate">{U.closingNotes(request.closingNotes)}</p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-cmp-ink">{U.itemsTitle}</h2>
        <ul className="space-y-2">
          {request.items.map((item, index) => (
            <li key={index} className="space-y-1 rounded-xl border border-cmp-rule bg-white p-3 text-sm">
              <p className="font-medium text-cmp-ink">
                {REQUEST_ITEM_TYPE_LABELS[item.itemType]}
                {item.documentType ? ` · ${U.itemDocument(COMMERCIAL_DOCUMENT_TYPE_LABELS[item.documentType])}` : ''}
                {item.fieldPath ? ` · ${U.itemField(item.fieldPath)}` : ''}
              </p>
              <p className="whitespace-pre-line break-words text-cmp-ink">{item.description}</p>
              {item.acceptableResponse && (
                <p className="break-words text-cmp-slate">{U.itemAcceptable(item.acceptableResponse)}</p>
              )}
              {item.linkedDocumentId !== null && <p className="text-xs text-cmp-slate">{U.itemLinked}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-cmp-ink">{U.timelineTitle}</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-cmp-slate">{U.timelineEmpty}</p>
        ) : (
          <ol className="space-y-2">
            {timeline.map((entry) =>
              entry.kind === 'response' ? (
                <li key={`r-${entry.at}`} className="rounded-xl border border-cmp-rule bg-white p-3 text-sm">
                  <p className="text-xs text-cmp-slate">{U.responseOn(formatBogotaDateTime(entry.at))}</p>
                  {entry.response.message && (
                    <p className="whitespace-pre-line break-words text-cmp-ink">{entry.response.message}</p>
                  )}
                  <ResponseAttachments commercialPublicId={request.commercialPublicId} response={entry.response} />
                </li>
              ) : (
                <li key={`v-${entry.at}`} className="rounded-xl border border-cmp-rule bg-cmp-rule-soft/40 p-3 text-sm">
                  <p className="text-xs text-cmp-slate">
                    {U.reviewOn(
                      entry.review.result === 'SUFFICIENT' ? U.resultSufficient : U.resultInsufficient,
                      formatBogotaDateTime(entry.at),
                    )}
                  </p>
                  {entry.review.notes && (
                    <p className="whitespace-pre-line break-words text-cmp-ink">{entry.review.notes}</p>
                  )}
                </li>
              ),
            )}
          </ol>
        )}
      </section>

      <RequestCommunications communications={request.communications} />

      {dialog === 'review' && <RequestReviewDialog requestPublicId={request.publicId} onClose={close} />}
      {dialog === 'cancel' && <RequestCancelDialog requestPublicId={request.publicId} onClose={close} />}
      {dialog === 'finding' && (
        <FindingDialog
          commercialPublicId={request.commercialPublicId}
          requestPublicId={request.publicId}
          companyName={request.companyName}
          onClose={close}
        />
      )}
    </div>
  );
}

function RequestNotFound() {
  return (
    <div className="space-y-3">
      <EmptyState icon={ClipboardList} title={A.requestNotFound} />
      <p className="text-center text-sm">
        <Link href={INFORMATION_REQUESTS_PATH} className="text-cmp-azul hover:underline">
          {U.backToQueue}
        </Link>
      </p>
    </div>
  );
}

function RequestLoader({ requestPublicId }: { requestPublicId: string }) {
  const query = useComplianceRequest(requestPublicId);

  if (query.data) return <RequestBody request={query.data} />;
  if (query.isPending) {
    return (
      <div role="status" className="space-y-3">
        <span className="sr-only">{U.requestLoading}</span>
        <div className="cmp-skeleton h-16 rounded-xl" />
        <div className="cmp-skeleton h-40 rounded-xl" />
      </div>
    );
  }
  const view = requestDetailLoadView(query.error);
  if (view === 'not-found') return <RequestNotFound />;
  if (view === 'forbidden') return <EmptyState icon={AlertCircle} title={A.forbidden} />;
  return <ErrorState message={A.requestDetailLoadError} onRetry={() => void query.refetch()} />;
}

// Un id que no es UUID no llega a la consulta (CA-6).
export function RequestDetail({ requestPublicId }: { requestPublicId: string }) {
  if (!isUuid(requestPublicId)) return <RequestNotFound />;
  return <RequestLoader requestPublicId={requestPublicId} />;
}

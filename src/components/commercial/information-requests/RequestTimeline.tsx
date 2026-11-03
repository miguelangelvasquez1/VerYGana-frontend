import { buildTimeline } from '@/lib/informationRequests/requests';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { InformationRequest } from '@/types/compliance/InformationRequest.types';

interface RequestTimelineProps {
  request: InformationRequest;
  // Nombre del archivo por id de documento; si falta, se muestra "Documento adjunto".
  documentNames: ReadonlyMap<number, string>;
}

// Conversación en orden cronológico: respuestas del empresario, revisiones de VERYGANA y, si
// la solicitud ya se cerró, el cierre (CA-9).
export function RequestTimeline({ request, documentNames }: RequestTimelineProps) {
  const entries = buildTimeline(request);

  if (entries.length === 0 && !request.closedAt) {
    return <p className="text-sm text-gray-600">{T.noResponses}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry, index) =>
        entry.kind === 'response' ? (
          <li
            key={`response-${index}`}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:ml-6"
          >
            <p className="text-xs text-gray-500">{T.receivedOn(formatBogotaDateTime(entry.response.receivedAt))}</p>
            {entry.response.message && (
              <p className="whitespace-pre-line break-words text-sm text-gray-800">{entry.response.message}</p>
            )}
            {entry.response.documentIds.length > 0 && (
              <ul className="flex flex-col gap-1">
                {entry.response.documentIds.map((id) => (
                  <li key={id} className="break-words text-sm font-medium text-gray-700">
                    {documentNames.get(id) ?? T.attachedDocument}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ) : (
          <li
            key={`review-${index}`}
            className="flex flex-col gap-1 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:mr-6"
          >
            <p className="text-sm font-semibold text-gray-900">
              {entry.review.result === 'SUFFICIENT' ? T.reviewSufficient : T.reviewInsufficient}
            </p>
            {entry.review.notes && (
              <p className="whitespace-pre-line break-words text-sm text-gray-800">{entry.review.notes}</p>
            )}
            <p className="text-xs text-gray-500">{formatBogotaDateTime(entry.review.reviewedAt)}</p>
          </li>
        ),
      )}
      {request.closedAt && (
        <li className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-900">{T.closedOn(formatBogotaDateTime(request.closedAt))}</p>
          {request.closingNotes && (
            <p className="whitespace-pre-line break-words text-sm text-gray-800">{request.closingNotes}</p>
          )}
        </li>
      )}
    </ol>
  );
}

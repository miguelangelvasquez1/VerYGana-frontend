'use client';

import { useState } from 'react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { CollapsibleSection } from '@/components/commercial/tax-profile/CollapsibleSection';
import type { ExpedienteGroup } from '@/lib/expediente/expediente';
import { EXPEDIENTE_TEXTS as T } from '@/lib/labels/expedienteRequests';
import {
  COMMERCIAL_DOCUMENT_TYPE_LABELS,
  DOCUMENT_EXPIRED_LABEL,
  DOCUMENT_REVIEW_LABELS,
} from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

interface ExpedienteDocumentGroupProps {
  group: ExpedienteGroup;
  // Id del documento que se está abriendo, para no lanzar dos aperturas a la vez.
  viewingId: number | null;
  onView: (document: ExpedienteDocument) => void;
  onReplace: (document: ExpedienteDocument) => void;
}

const secondaryButton =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50';

// Un grupo por tipo de documento: los vigentes arriba y los reemplazados en "Historial" (CA-1).
// Sin acciones de eliminar ni de editar (CA-7).
export function ExpedienteDocumentGroup({ group, viewingId, onView, onReplace }: ExpedienteDocumentGroupProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const typeLabel = COMMERCIAL_DOCUMENT_TYPE_LABELS[group.type];
  const historyId = `expediente-history-${group.type}`;

  return (
    <section
      aria-labelledby={`expediente-group-${group.type}`}
      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id={`expediente-group-${group.type}`} className="text-base font-bold text-gray-900">
        {typeLabel}
      </h2>

      {group.current.map((doc) => {
        const review = DOCUMENT_REVIEW_LABELS[doc.reviewStatus ?? 'NOT_REVIEWED'];
        return (
          <article
            key={doc.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="break-words text-sm font-semibold text-gray-900">{doc.originalFileName}</p>
              <p className="text-xs text-gray-500">{T.uploadedOn(formatBogotaDateTime(doc.uploadedAt))}</p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={review.label} tone={review.tone} />
                {doc.expired && <StatusBadge label={DOCUMENT_EXPIRED_LABEL.label} tone={DOCUMENT_EXPIRED_LABEL.tone} />}
                {doc.expiresAt && <span className="text-xs text-gray-500">{T.expiresOn(formatPlainDate(doc.expiresAt))}</span>}
              </div>
              {doc.reviewNotes && (
                <p className="whitespace-pre-line break-words text-sm text-gray-700">{doc.reviewNotes}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onView(doc)}
                disabled={viewingId === doc.id}
                className={secondaryButton}
              >
                {T.view}
              </button>
              <button type="button" onClick={() => onReplace(doc)} className={secondaryButton}>
                {T.replace}
              </button>
            </div>
          </article>
        );
      })}

      {group.history.length > 0 && (
        <CollapsibleSection
          id={historyId}
          title={T.history}
          open={historyOpen}
          onToggle={() => setHistoryOpen((value) => !value)}
        >
          <ul className="flex flex-col gap-2">
            {group.history.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="break-words text-sm font-semibold text-gray-800">{doc.originalFileName}</p>
                  {doc.supersededAt && (
                    <p className="text-xs text-gray-500">{T.supersededOn(formatBogotaDateTime(doc.supersededAt))}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onView(doc)}
                  disabled={viewingId === doc.id}
                  className={secondaryButton}
                >
                  {T.view}
                </button>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </section>
  );
}

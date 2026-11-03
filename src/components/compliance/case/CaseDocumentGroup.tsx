import { CollapsibleSection } from '@/components/commercial/tax-profile/CollapsibleSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ExpedienteGroup } from '@/lib/expediente/expediente';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import {
  COMMERCIAL_DOCUMENT_TYPE_LABELS,
  DOCUMENT_EXPIRED_LABEL,
  DOCUMENT_REVIEW_LABELS,
} from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

interface CaseDocumentGroupProps {
  group: ExpedienteGroup;
  // Id del documento que se está abriendo, para no lanzar dos aperturas a la vez.
  openingId: number | null;
  historyOpen: boolean;
  onToggleHistory: () => void;
  onView: (document: ExpedienteDocument) => void;
  onReview: (document: ExpedienteDocument) => void;
}

const secondaryButton =
  'cursor-pointer rounded-lg border border-cmp-rule px-3 py-1.5 text-sm font-semibold text-cmp-ink hover:bg-cmp-rule-soft/50 disabled:opacity-50';

function ReviewInfo({ doc }: { doc: ExpedienteDocument }) {
  const review = DOCUMENT_REVIEW_LABELS[doc.reviewStatus ?? 'NOT_REVIEWED'];
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={review.label} tone={review.tone} />
        {doc.expired && <StatusBadge label={DOCUMENT_EXPIRED_LABEL.label} tone={DOCUMENT_EXPIRED_LABEL.tone} />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-cmp-slate">
        {doc.holderIdentification && <span className="break-words">{T.holder(doc.holderIdentification)}</span>}
        {doc.issuedAt && <span>{T.issuedOn(formatPlainDate(doc.issuedAt))}</span>}
        {doc.expiresAt && <span>{T.expiresOn(formatPlainDate(doc.expiresAt))}</span>}
        {doc.reviewedAt && <span>{T.reviewedAtDocument(formatBogotaDateTime(doc.reviewedAt))}</span>}
      </div>
      {doc.reviewNotes && (
        <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{doc.reviewNotes}</p>
      )}
    </>
  );
}

// Un grupo por tipo: los vigentes arriba, con "Ver" y "Revisar", y el historial plegado, solo con "Ver" (CA-13).
export function CaseDocumentGroup({
  group,
  openingId,
  historyOpen,
  onToggleHistory,
  onView,
  onReview,
}: CaseDocumentGroupProps) {
  const headingId = `case-group-${group.type}`;
  const typeLabel = COMMERCIAL_DOCUMENT_TYPE_LABELS[group.type];
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-xl border border-cmp-rule bg-white p-4"
    >
      <h2 id={headingId} className="text-base font-semibold text-cmp-ink">
        {typeLabel}
      </h2>

      {group.current.map((doc) => (
        <article
          key={doc.id}
          className="flex flex-col gap-3 rounded-lg border border-cmp-rule-soft p-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="break-words text-sm font-semibold text-cmp-ink">{doc.originalFileName}</p>
            <p className="text-xs text-cmp-slate">{T.uploadedOn(formatBogotaDateTime(doc.uploadedAt))}</p>
            <ReviewInfo doc={doc} />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onView(doc)}
              disabled={openingId === doc.id}
              aria-label={T.viewOf(typeLabel)}
              className={secondaryButton}
            >
              {T.view}
            </button>
            <button
              type="button"
              onClick={() => onReview(doc)}
              aria-label={T.reviewDocumentOf(typeLabel)}
              className={secondaryButton}
            >
              {T.reviewDocument}
            </button>
          </div>
        </article>
      ))}

      {group.history.length > 0 && (
        <CollapsibleSection
          id={`case-history-${group.type}`}
          title={T.history}
          open={historyOpen}
          onToggle={onToggleHistory}
        >
          <ul className="flex flex-col gap-2">
            {group.history.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 rounded-lg bg-cmp-rule-soft/40 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="break-words text-sm font-semibold text-cmp-ink">{doc.originalFileName}</p>
                  {doc.supersededAt && (
                    <p className="text-xs text-cmp-slate">{T.supersededOn(formatBogotaDateTime(doc.supersededAt))}</p>
                  )}
                  <ReviewInfo doc={doc} />
                </div>
                <button
                  type="button"
                  onClick={() => onView(doc)}
                  disabled={openingId === doc.id}
                  aria-label={T.viewOf(typeLabel)}
                  className={`${secondaryButton} shrink-0 self-start`}
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

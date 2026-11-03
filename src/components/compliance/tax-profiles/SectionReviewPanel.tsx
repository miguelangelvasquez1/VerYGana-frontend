import { Btn } from '@/components/compliance/ui/primitives';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { SECTION_REVIEW_LABELS, SECTION_REVIEW_PENDING } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { SectionReview, SectionReviewResult } from '@/types/commercial/TaxProfile.types';

interface SectionReviewPanelProps {
  review: SectionReview | null;
  disabled?: boolean;
  onReview: (result: SectionReviewResult) => void;
}

// Último resultado de la sección (o "Pendiente de revisión") y los tres botones (RN-3).
export function SectionReviewPanel({ review, disabled, onReview }: SectionReviewPanelProps) {
  const badge = review ? SECTION_REVIEW_LABELS[review.result] : SECTION_REVIEW_PENDING;
  return (
    <div className="space-y-3 rounded-xl border border-cmp-rule bg-cmp-rule-soft/30 p-4">
      <StatusBadge label={badge.label} tone={badge.tone} />
      {review && (
        <div className="space-y-1">
          {review.notes && (
            <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{review.notes}</p>
          )}
          <p className="text-xs text-cmp-slate">{T.reviewedOn(formatBogotaDateTime(review.reviewedAt))}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Btn size="sm" variant="approve" disabled={disabled} onClick={() => onReview('VERIFIED')}>
          {T.verify}
        </Btn>
        <Btn size="sm" variant="quiet" disabled={disabled} onClick={() => onReview('OBSERVED')}>
          {T.observe}
        </Btn>
        <Btn size="sm" variant="quiet" disabled={disabled} onClick={() => onReview('NOT_APPLICABLE')}>
          {T.notApplicable}
        </Btn>
      </div>
    </div>
  );
}

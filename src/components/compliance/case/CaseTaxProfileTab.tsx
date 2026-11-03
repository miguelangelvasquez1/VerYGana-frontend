'use client';

import Link from 'next/link';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { useComplianceTaxProfile } from '@/hooks/compliance/useComplianceTaxProfiles';
import { taxProfileReviewPath } from '@/lib/compliance/routes';
import { summarizeSectionReviews } from '@/lib/compliance/taxProfileReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { TAX_PROFILE_STATUS_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import { TabError, TabLoading } from './TabState';

// Pestaña "Ficha tributaria": resumen y salida a la revisión (CA-20).
export function CaseTaxProfileTab({ commercialPublicId }: { commercialPublicId: string }) {
  const query = useComplianceTaxProfile(commercialPublicId);
  const data = query.data;

  if (!data) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="tax-profile" onRetry={() => void query.refetch()} />;
  }

  const status = TAX_PROFILE_STATUS_LABELS[data.profile.status];
  return (
    <div className="space-y-3 rounded-xl border border-cmp-rule bg-white p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusBadge label={status.label} tone={status.tone} />
        <span className="text-sm text-cmp-slate">{T.currentVersion(data.profile.currentVersion)}</span>
        <span className="text-sm text-cmp-slate">
          {T.updatedOn(formatBogotaDateTime(data.profile.updatedAt))}
        </span>
      </div>
      <p className="text-sm text-cmp-ink">
        {T.sectionsSummary(summarizeSectionReviews(data.profile.sectionReviews))}
      </p>
      <Link
        href={taxProfileReviewPath(commercialPublicId)}
        className="inline-block text-sm font-semibold text-cmp-azul underline"
      >
        {T.openReview}
      </Link>
    </div>
  );
}

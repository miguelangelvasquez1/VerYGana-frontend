import Link from 'next/link';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { casePath } from '@/lib/compliance/routes';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { TAX_PROFILE_STATUS_LABELS } from '@/lib/labels/taxCompliance';
import { COMMERCIAL_ACTIVITY_TYPE_LABELS } from '@/services/ComplianceService';
import type { ComplianceTaxProfileResponse } from '@/types/commercial/TaxProfile.types';

// Cabecera de la revisión. La vocación se muestra solo para contrastar (RN-1).
export function ReviewHeader({ data }: { data: ComplianceTaxProfileResponse }) {
  const status = TAX_PROFILE_STATUS_LABELS[data.profile.status];
  const vocation = data.commercialActivityType
    ? COMMERCIAL_ACTIVITY_TYPE_LABELS[data.commercialActivityType]
    : T.vocationUndefined;
  return (
    <header className="space-y-2 border-b border-cmp-rule pb-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="min-w-0 break-words text-[22px] font-semibold leading-tight text-cmp-ink">
          {data.companyName}
        </h1>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>
      <p className="cmp-mono break-words text-sm text-cmp-slate">{T.nit(data.nit)}</p>
      <p className="text-sm text-cmp-slate">{T.currentVersion(data.profile.currentVersion)}</p>
      <p className="text-sm text-cmp-slate">
        {T.vocationLabel}: <span className="font-medium text-cmp-ink">{vocation}</span>
        <span className="block text-xs">{T.vocationNote}</span>
      </p>
      <Link
        href={casePath(data.commercialPublicId, 'tax-profile')}
        className="inline-block text-sm font-semibold text-cmp-azul underline"
      >
        {T.viewCase}
      </Link>
    </header>
  );
}

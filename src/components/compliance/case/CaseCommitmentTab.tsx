'use client';

import { useMemo } from 'react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { useCaseCommitment } from '@/hooks/compliance/useComplianceCase';
import { sortManifestationsDesc } from '@/lib/compliance/taxProfileReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { MANIFESTATION_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import { TabEmpty, TabError, TabLoading } from './TabState';

// Manifestaciones del compromiso de formalización, de la más reciente a la más antigua (CA-21). Solo lectura.
export function CaseCommitmentTab({ commercialPublicId }: { commercialPublicId: string }) {
  const query = useCaseCommitment(commercialPublicId);
  const items = useMemo(() => sortManifestationsDesc(query.data ?? []), [query.data]);

  if (query.data === undefined) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="commitment" onRetry={() => void query.refetch()} />;
  }
  if (items.length === 0) return <TabEmpty message={T.emptyCommitment} />;

  return (
    <ol className="flex flex-col gap-3">
      {items.map((m) => {
        const status = MANIFESTATION_LABELS[m.status];
        return (
          <li key={m.id} className="space-y-1.5 rounded-xl border border-cmp-rule bg-white p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusBadge label={status.label} tone={status.tone} />
              <span className="text-sm text-cmp-slate">{T.contractVersion(m.contractVersion)}</span>
              <span className="text-sm text-cmp-slate">{formatBogotaDateTime(m.occurredAt)}</span>
            </div>
            <p className="break-words text-sm text-cmp-ink">
              {m.actorLegalRepName ? T.legalRep(m.actorLegalRepName) : T.system}
            </p>
            {m.detail && <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{m.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}

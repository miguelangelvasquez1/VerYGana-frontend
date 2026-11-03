'use client';

import { useState } from 'react';

import { FindingDialog } from '@/components/compliance/findings/FindingDialog';
import { Btn } from '@/components/compliance/ui/primitives';
import { useCaseFindings } from '@/hooks/compliance/useComplianceCase';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import {
  ACCOUNT_STATUS_LABELS,
  CONTRACTUAL_MEASURE_LABELS,
  FINDING_CLASSIFICATION_LABELS,
  FINDING_SEVERITY_LABELS,
} from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { Finding } from '@/types/compliance/InformationRequest.types';
import { TabEmpty, TabError, TabLoading } from './TabState';

// Hallazgos del empresario (RN-10, RN-11, CA-22).
export function CaseFindingsTab({
  commercialPublicId,
  companyName,
}: {
  commercialPublicId: string;
  companyName: string | null;
}) {
  const [creating, setCreating] = useState(false);
  const query = useCaseFindings(commercialPublicId);

  const newButton = (
    <div className="flex justify-end">
      <Btn variant="primary" onClick={() => setCreating(true)}>
        {U.actions.finding}
      </Btn>
    </div>
  );
  const dialog = creating && (
    <FindingDialog
      commercialPublicId={commercialPublicId}
      companyName={companyName}
      onClose={() => setCreating(false)}
    />
  );

  if (query.data === undefined) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="findings" onRetry={() => void query.refetch()} />;
  }
  if (query.data.length === 0) {
    return (
      <div className="space-y-3">
        {newButton}
        <TabEmpty message={T.emptyFindings} />
        {dialog}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {newButton}
      <FindingsList findings={query.data} />
      {dialog}
    </div>
  );
}

function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {findings.map((f) => (
        <li key={f.publicId} className="space-y-2 rounded-xl border border-cmp-rule bg-white p-4">
          <p className="text-xs text-cmp-slate">{formatBogotaDateTime(f.decidedAt)}</p>
          <p className="whitespace-pre-line break-words text-sm font-medium text-cmp-ink">{f.factObserved}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-cmp-slate">
            <span>{T.classificationLabel(FINDING_CLASSIFICATION_LABELS[f.classification])}</span>
            <span>{T.severityLabel(FINDING_SEVERITY_LABELS[f.severity])}</span>
            <span>{T.remediable(f.remediable)}</span>
            <span>{T.measureLabel(CONTRACTUAL_MEASURE_LABELS[f.measure])}</span>
          </div>
          {f.accountStatusApplied && (
            <p className="text-sm font-semibold text-cmp-ink">
              {T.accountStatusApplied(ACCOUNT_STATUS_LABELS[f.accountStatusApplied])}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

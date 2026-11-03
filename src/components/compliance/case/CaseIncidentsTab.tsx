'use client';

import { useState } from 'react';

import { IncidentDialog } from '@/components/compliance/findings/IncidentDialog';
import { Btn } from '@/components/compliance/ui/primitives';
import { useCaseIncidents } from '@/hooks/compliance/useComplianceCase';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import { TabEmpty, TabError, TabLoading } from './TabState';

// Incidencias del empresario; la 018 permite registrar una nueva.
export function CaseIncidentsTab({ commercialPublicId }: { commercialPublicId: string }) {
  const [creating, setCreating] = useState(false);
  const query = useCaseIncidents(commercialPublicId);

  const newButton = (
    <div className="flex justify-end">
      <Btn variant="primary" onClick={() => setCreating(true)}>
        {U.newIncident}
      </Btn>
    </div>
  );
  const dialog = creating && (
    <IncidentDialog commercialPublicId={commercialPublicId} onClose={() => setCreating(false)} />
  );

  if (query.data === undefined) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="incidents" onRetry={() => void query.refetch()} />;
  }
  if (query.data.length === 0) {
    return (
      <div className="space-y-3">
        {newButton}
        <TabEmpty message={T.emptyIncidents} />
        {dialog}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {newButton}
      <ul className="flex flex-col gap-3">
        {query.data.map((i) => (
          <li key={i.id} className="space-y-1.5 rounded-xl border border-cmp-rule bg-white p-4">
            <p className="text-xs text-cmp-slate">{formatBogotaDateTime(i.occurredAt)}</p>
            <p className="break-words text-sm font-semibold text-cmp-ink">{i.context}</p>
            <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{i.description}</p>
            <p className="text-xs text-cmp-slate">
              {i.reportedBySystem ? T.reportedBySystem : T.registeredByCompliance}
            </p>
          </li>
        ))}
      </ul>
      {dialog}
    </div>
  );
}

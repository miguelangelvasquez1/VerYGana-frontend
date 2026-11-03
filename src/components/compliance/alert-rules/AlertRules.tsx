'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { AlertRuleDialog } from '@/components/compliance/alert-rules/AlertRuleDialog';
import { AlertRuleGroup } from '@/components/compliance/alert-rules/AlertRuleGroup';
import { Btn, EmptyState, ErrorState, PanelHeader, SkeletonRows } from '@/components/compliance/ui/primitives';
import { useAlertRules } from '@/hooks/compliance/useComplianceAlerts';
import { readApiError } from '@/lib/api/apiError';
import { groupRulesByCode } from '@/lib/compliance/alertRules';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

export function AlertRules() {
  const [creating, setCreating] = useState(false);
  const query = useAlertRules();
  const groups = useMemo(() => groupRulesByCode(query.data ?? []), [query.data]);
  const forbidden = query.isError && readApiError(query.error).status === 403;

  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow={U.rulesEyebrow}
        title={U.rulesTitle}
        actions={
          <Btn variant="primary" onClick={() => setCreating(true)}>
            {U.newRule}
          </Btn>
        }
      />
      <p className="text-sm text-cmp-slate">{A.ruleScopeNote}</p>

      {query.isPending ? (
        <SkeletonRows rows={3} cols={3} />
      ) : query.isError && query.data === undefined ? (
        forbidden ? (
          <EmptyState icon={SlidersHorizontal} title={A.forbidden} />
        ) : (
          <ErrorState message={A.rulesLoadError} onRetry={() => void query.refetch()} />
        )
      ) : groups.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title={A.rulesEmpty} />
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <AlertRuleGroup key={group.code} group={group} rules={query.data ?? []} />
          ))}
        </ul>
      )}

      {creating && <AlertRuleDialog rules={query.data ?? []} onClose={() => setCreating(false)} />}
    </div>
  );
}

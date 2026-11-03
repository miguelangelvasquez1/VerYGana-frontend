'use client';

import { useState } from 'react';

import { AlertRuleDialog } from '@/components/compliance/alert-rules/AlertRuleDialog';
import { AlertRuleDeactivateDialog } from '@/components/compliance/alert-rules/AlertRuleDeactivateDialog';
import { Btn } from '@/components/compliance/ui/primitives';
import { parseRuleParams, type RuleGroup } from '@/lib/compliance/alertRules';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { formatCents } from '@/lib/money/cents';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { AlertRule } from '@/types/compliance/InformationRequest.types';

function RuleParams({ rule }: { rule: AlertRule }) {
  const params = parseRuleParams(rule.paramsJson);
  if (params === null) return <p className="text-xs text-cmp-slate">{U.ruleParamsUnreadable}</p>;
  return (
    <p className="text-xs text-cmp-slate">
      {U.ruleParams(params.windowDays, params.minGrowthPct, formatCents(params.minCurrentSalesCents))}
    </p>
  );
}

function RuleVersion({ rule }: { rule: AlertRule }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-cmp-ink">
        {U.versionOf(rule.version)} · {formatBogotaDateTime(rule.createdAt)}
      </p>
      <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{rule.description}</p>
      <p className="whitespace-pre-line break-words text-xs text-cmp-slate">{rule.legalBasis}</p>
      <RuleParams rule={rule} />
    </div>
  );
}

// Una regla por código: la versión activa arriba, las anteriores en un desplegable.
export function AlertRuleGroup({ group, rules }: { group: RuleGroup; rules: readonly AlertRule[] }) {
  const [deactivating, setDeactivating] = useState(false);
  const [versioning, setVersioning] = useState(false);

  return (
    <li className="space-y-3 rounded-xl border border-cmp-rule bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="cmp-mono text-sm font-semibold text-cmp-ink">{group.code}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {!group.active && <span className="text-xs text-cmp-slate">{U.noActiveVersion}</span>}
          <Btn size="sm" variant="quiet" onClick={() => setVersioning(true)}>
            {U.newVersion}
          </Btn>
          {group.active && (
            <Btn size="sm" variant="reject" onClick={() => setDeactivating(true)}>
              {U.deactivate}
            </Btn>
          )}
        </div>
      </div>
      {group.active && (
        <div className="space-y-1">
          <p className="cmp-label text-cmp-clear">{U.active}</p>
          <RuleVersion rule={group.active} />
        </div>
      )}
      {group.history.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-cmp-azul">{U.history(group.history.length)}</summary>
          <ul className="mt-2 space-y-3">
            {group.history.map((rule) => (
              <li key={rule.id} className="border-l-2 border-cmp-rule pl-3">
                <RuleVersion rule={rule} />
              </li>
            ))}
          </ul>
        </details>
      )}
      {versioning && (
        <AlertRuleDialog rules={rules} fixedCode={group.code} onClose={() => setVersioning(false)} />
      )}
      {deactivating && group.active && (
        <AlertRuleDeactivateDialog rule={group.active} onClose={() => setDeactivating(false)} />
      )}
    </li>
  );
}

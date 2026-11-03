'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

import { AlertCard } from '@/components/compliance/alerts/AlertCard';
import { EmptyState, ErrorState, Pager, PanelHeader, SkeletonRows } from '@/components/compliance/ui/primitives';
import { useAlerts } from '@/hooks/compliance/useComplianceAlerts';
import { readApiError } from '@/lib/api/apiError';
import { alertsPath, previousQueuePage } from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

export function AlertsList({ pendingOnly, page }: { pendingOnly: boolean; page: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const query = useAlerts({ pendingOnly, page });

  const go = (next: { pendingOnly: boolean; page: number }) => {
    if (pending) return;
    startTransition(() => router.push(alertsPath(next)));
  };

  const forbidden = query.isError && readApiError(query.error).status === 403;
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-5">
      <PanelHeader eyebrow={U.alertsEyebrow} title={U.alertsTitle} />

      <label className="inline-flex items-center gap-2 text-sm text-cmp-ink">
        <input
          type="checkbox"
          checked={pendingOnly}
          disabled={pending}
          onChange={(e) => go({ pendingOnly: e.target.checked, page: 1 })}
        />
        {A.alerts.pendingOnly}
      </label>

      {query.isPending ? (
        <SkeletonRows rows={4} cols={3} />
      ) : query.isError && query.data === undefined ? (
        forbidden ? (
          <EmptyState icon={Bell} title={A.forbidden} />
        ) : (
          <ErrorState message={A.alertsLoadError} onRetry={() => void query.refetch()} />
        )
      ) : rows.length === 0 ? (
        <>
          <EmptyState icon={Bell} title={A.alertsEmpty(pendingOnly)} tone="clear" />
          {meta && page > 1 && (
            <Pager
              page={page - 1}
              totalPages={meta.totalPages}
              total={meta.totalElements}
              onChange={() => go({ pendingOnly, page: previousQueuePage(page, meta.totalPages) })}
            />
          )}
        </>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </ul>
          {meta && (
            <Pager
              page={page - 1}
              totalPages={meta.totalPages}
              total={meta.totalElements}
              onChange={(p) => go({ pendingOnly, page: p + 1 })}
            />
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

import {
  EmptyState,
  ErrorState,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  Pager,
  PanelHeader,
  SkeletonRows,
  Tabs,
  Td,
  Th,
  ThSpine,
  type Tone,
} from '@/components/compliance/ui/primitives';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRequestQueue } from '@/hooks/compliance/useComplianceRequests';
import { readApiError } from '@/lib/api/apiError';
import {
  previousQueuePage,
  REQUEST_QUEUE_STATUSES,
  requestDetailPath,
  requestQueuePath,
  type RequestQueueStatus,
} from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { REQUEST_STATUS_LABELS_COMPLIANCE, TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { InformationRequestStatus } from '@/types/compliance/InformationRequest.types';

const FILTER_OPTIONS = REQUEST_QUEUE_STATUSES.map((value) => ({
  value,
  label: value === 'ALL' ? U.filterAll : REQUEST_STATUS_LABELS_COMPLIANCE[value].label,
}));

const ROW_TONE: Record<InformationRequestStatus, Tone> = {
  OPEN: 'hold',
  RESPONDED: 'info',
  OBSERVED: 'hold',
  CLOSED_SATISFIED: 'clear',
  CLOSED_WITH_FINDING: 'neutral',
  CANCELLED: 'neutral',
};

// Cola de requerimientos. El filtro y la página viven en la URL (props de la página de servidor).
export function RequestQueue({ status, page }: { status: RequestQueueStatus; page: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const query = useRequestQueue({ status, page });

  const go = (next: { status: RequestQueueStatus; page: number }) => {
    if (pending) return;
    startTransition(() => router.push(requestQueuePath(next)));
  };

  const forbidden = query.isError && readApiError(query.error).status === 403;
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-5">
      <PanelHeader eyebrow={U.requestsEyebrow} title={U.requestsTitle} />

      <div className={pending ? 'pointer-events-none opacity-60' : ''} aria-busy={pending}>
        <Tabs
          options={FILTER_OPTIONS}
          value={status}
          onChange={(next) => go({ status: next, page: 1 })}
          layoutId="cmp-request-queue-filter"
        />
      </div>

      {query.isPending ? (
        <SkeletonRows rows={5} cols={6} />
      ) : query.isError && query.data === undefined ? (
        forbidden ? (
          <EmptyState icon={ClipboardList} title={A.forbidden} />
        ) : (
          <ErrorState message={A.requestsLoadError} onRetry={() => void query.refetch()} />
        )
      ) : rows.length === 0 ? (
        <>
          <EmptyState icon={ClipboardList} title={A.requestsEmpty(status !== 'ALL')} />
          {meta && page > 1 && (
            <Pager
              page={page - 1}
              totalPages={meta.totalPages}
              total={meta.totalElements}
              onChange={() => go({ status, page: previousQueuePage(page, meta.totalPages) })}
            />
          )}
        </>
      ) : (
        <>
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <ThSpine />
                <Th>{U.columnCompany}</Th>
                <Th>{U.columnType}</Th>
                <Th>{U.columnStatus}</Th>
                <Th>{U.columnIssued}</Th>
                <Th>{U.columnIssuedBy}</Th>
                <Th>{U.columnDue}</Th>
              </LedgerHead>
              <LedgerBody>
                {rows.map((row, index) => {
                  const label = REQUEST_STATUS_LABELS_COMPLIANCE[row.status];
                  return (
                    <LedgerRow
                      key={row.publicId}
                      tone={ROW_TONE[row.status]}
                      index={index}
                      ariaLabel={U.openRequestOf(row.companyName)}
                      onActivate={() => router.push(requestDetailPath(row.publicId))}
                    >
                      <Td className="font-medium text-cmp-ink">{row.companyName}</Td>
                      <Td>{TRIGGER_LABELS[row.trigger]}</Td>
                      <Td>
                        <StatusBadge label={label.label} tone={label.tone} />
                      </Td>
                      <Td className="whitespace-nowrap text-cmp-slate">{formatBogotaDateTime(row.issuedAt)}</Td>
                      <Td className="whitespace-nowrap text-cmp-slate">{row.issuedBySystem ? U.system : U.compliance}</Td>
                      <Td className="whitespace-nowrap text-cmp-slate">
                        {row.dueDate ? formatPlainDate(row.dueDate) : U.dash}
                      </Td>
                    </LedgerRow>
                  );
                })}
              </LedgerBody>
            </LedgerTable>
          </Ledger>
          {meta && (
            <div className={pending ? 'pointer-events-none opacity-60' : ''}>
              <Pager
                page={page - 1}
                totalPages={meta.totalPages}
                total={meta.totalElements}
                onChange={(p) => go({ status, page: p + 1 })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

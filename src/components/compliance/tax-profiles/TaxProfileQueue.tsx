'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet } from 'lucide-react';

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
import { useTaxProfileQueue } from '@/hooks/compliance/useComplianceTaxProfiles';
import { readApiError } from '@/lib/api/apiError';
import { previousQueuePage, queuePath, taxProfileReviewPath, type QueueStatus } from '@/lib/compliance/routes';
import {
  COMPLIANCE_TAX_REVIEW_TEXTS as T,
  QUEUE_FILTER_LABELS,
} from '@/lib/labels/complianceTaxReview';
import { TAX_PROFILE_STATUS_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { TaxProfileStatus } from '@/types/commercial/TaxProfile.types';

const FILTER_ORDER: QueueStatus[] = ['SUBMITTED', 'OBSERVED', 'REVIEWED', 'ALL'];
const FILTER_OPTIONS = FILTER_ORDER.map((value) => ({ value, label: QUEUE_FILTER_LABELS[value] }));

const ROW_TONE: Record<TaxProfileStatus, Tone> = {
  SUBMITTED: 'info',
  OBSERVED: 'hold',
  REVIEWED: 'clear',
};

// Cola de fichas tributarias. El filtro y la página viven en la URL (props de la página de servidor).
export function TaxProfileQueue({ status, page }: { status: QueueStatus; page: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const query = useTaxProfileQueue({ status, page });

  const go = (next: { status: QueueStatus; page: number }) => {
    if (pending) return;
    startTransition(() => router.push(queuePath(next)));
  };

  const forbidden = query.isError && readApiError(query.error).status === 403;
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-5">
      <PanelHeader eyebrow={T.eyebrow} title={T.queueTitle} />

      <div className={pending ? 'pointer-events-none opacity-60' : ''} aria-busy={pending}>
        <Tabs
          options={FILTER_OPTIONS}
          value={status}
          onChange={(next) => go({ status: next, page: 1 })}
          layoutId="cmp-tax-queue-filter"
        />
      </div>

      {query.isPending ? (
        <SkeletonRows rows={5} cols={4} />
      ) : query.isError && query.data === undefined ? (
        forbidden ? (
          <EmptyState icon={FileSpreadsheet} title={T.forbidden} />
        ) : (
          <ErrorState message={T.queueLoadError} onRetry={() => void query.refetch()} />
        )
      ) : rows.length === 0 ? (
        <>
          <EmptyState icon={FileSpreadsheet} title={T.queueEmpty(status)} />
          {meta && page > 1 && (
            <div className={pending ? 'pointer-events-none opacity-60' : ''}>
              <Pager
                page={page - 1}
                totalPages={meta.totalPages}
                total={meta.totalElements}
                onChange={() => go({ status, page: previousQueuePage(page, meta.totalPages) })}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <ThSpine />
                <Th>{T.columnCompany}</Th>
                <Th>{T.columnStatus}</Th>
                <Th>{T.columnVersion}</Th>
                <Th>{T.columnUpdated}</Th>
              </LedgerHead>
              <LedgerBody>
                {rows.map((row, index) => {
                  const statusLabel = TAX_PROFILE_STATUS_LABELS[row.status];
                  return (
                    <LedgerRow
                      key={row.commercialPublicId}
                      tone={ROW_TONE[row.status]}
                      index={index}
                      ariaLabel={T.openProfileOf(row.companyName)}
                      onActivate={() => router.push(taxProfileReviewPath(row.commercialPublicId))}
                    >
                      <Td className="font-medium text-cmp-ink">{row.companyName}</Td>
                      <Td>
                        <StatusBadge label={statusLabel.label} tone={statusLabel.tone} />
                      </Td>
                      <Td className="cmp-mono">v{row.currentVersion}</Td>
                      <Td className="whitespace-nowrap text-cmp-slate">
                        {formatBogotaDateTime(row.updatedAt)}
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

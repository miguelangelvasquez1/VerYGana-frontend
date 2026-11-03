'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CreateRequestDialog } from '@/components/compliance/requests/CreateRequestDialog';
import {
  Btn,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  Pager,
  Td,
  Th,
} from '@/components/compliance/ui/primitives';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useCaseRequests } from '@/hooks/compliance/useComplianceCase';
import { requestDetailPath } from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { REQUEST_STATUS_LABELS_COMPLIANCE, TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import { TabEmpty, TabError, TabLoading } from './TabState';

// Requerimientos del empresario (la 018 reemplaza el solo lectura de la 017). La página vive en estado local (D-15).
export function CaseRequestsTab({ commercialPublicId }: { commercialPublicId: string }) {
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const query = useCaseRequests(commercialPublicId, page);

  const newRequestButton = (
    <div className="flex justify-end">
      <Btn variant="primary" onClick={() => setCreating(true)}>
        {U.newRequest}
      </Btn>
    </div>
  );
  const dialog = creating && (
    <CreateRequestDialog commercialPublicId={commercialPublicId} onClose={() => setCreating(false)} />
  );

  if (query.data === undefined) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="requests" onRetry={() => void query.refetch()} />;
  }
  const rows = query.data.data;
  if (rows.length === 0 && page === 0) {
    return (
      <div className="space-y-3">
        {newRequestButton}
        <TabEmpty message={T.emptyRequests} />
        {dialog}
      </div>
    );
  }

  const meta = query.data.meta;
  return (
    <div className="space-y-3">
      {newRequestButton}
      <Ledger>
        <LedgerTable>
          <LedgerHead>
            <Th>{T.columnType}</Th>
            <Th>{T.columnStatus}</Th>
            <Th>{T.columnIssuedBy}</Th>
            <Th>{T.columnIssued}</Th>
            <Th>{T.columnDue}</Th>
          </LedgerHead>
          <LedgerBody>
            {rows.map((row, index) => {
              const status = REQUEST_STATUS_LABELS_COMPLIANCE[row.status];
              return (
                <LedgerRow key={row.publicId} index={index}>
                  <Td className="font-medium text-cmp-ink">
                    <Link href={requestDetailPath(row.publicId)} className="text-cmp-azul hover:underline">
                      {TRIGGER_LABELS[row.trigger]}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge label={status.label} tone={status.tone} />
                  </Td>
                  <Td>{row.issuedBySystem ? T.system : T.complianceActor}</Td>
                  <Td className="whitespace-nowrap text-cmp-slate">{formatBogotaDateTime(row.issuedAt)}</Td>
                  <Td className="whitespace-nowrap text-cmp-slate">
                    {row.dueDate ? formatPlainDate(row.dueDate) : T.dash}
                  </Td>
                </LedgerRow>
              );
            })}
          </LedgerBody>
        </LedgerTable>
      </Ledger>
      {meta && (
        <Pager page={page} totalPages={meta.totalPages} total={meta.totalElements} onChange={setPage} />
      )}
      {dialog}
    </div>
  );
}

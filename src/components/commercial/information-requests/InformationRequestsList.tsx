'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { useInformationRequests } from '@/hooks/commercial/useInformationRequests';
import { readApiError } from '@/lib/api/apiError';
import { splitRequestsByTab } from '@/lib/informationRequests/requests';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';
import { REQUEST_STATUS_LABELS_COMMERCIAL, TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type { InformationRequest } from '@/types/compliance/InformationRequest.types';

type Tab = 'pending' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: T.tabPending },
  { id: 'history', label: T.tabHistory },
];

type InformationRequestsListProps =
  | { mode: 'profile' }
  | { mode: 'onboarding'; onSelect: (publicId: string) => void };

const cardClass =
  'flex w-full flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#03548C]/40 sm:p-5';

function RequestCard({ request }: { request: InformationRequest }) {
  const status = REQUEST_STATUS_LABELS_COMMERCIAL[request.status];
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status.label} tone={status.tone} />
        <span className="text-sm font-semibold text-gray-900">{TRIGGER_LABELS[request.trigger]}</span>
      </div>
      <p className="line-clamp-3 break-words text-sm text-gray-700">{request.reason}</p>
      <div className="flex flex-col gap-0.5 text-xs text-gray-500 sm:flex-row sm:gap-4">
        <span>{T.sentOn(formatBogotaDateTime(request.issuedAt))}</span>
        {request.dueDate && <span>{T.dueBefore(formatPlainDate(request.dueDate))}</span>}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

// Lista del empresario con pestañas "Pendientes" e "Historial" (CA-8).
export function InformationRequestsList(props: InformationRequestsListProps) {
  const query = useInformationRequests();
  const [tab, setTab] = useState<Tab>('pending');
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ pending: null, history: null });

  const split = useMemo(() => splitRequestsByTab(query.data ?? []), [query.data]);

  if (query.isPending) return <LoadingSkeleton />;

  if (query.isError) {
    const forbidden = readApiError(query.error).status === 403;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <p className="text-sm font-semibold text-red-700">{forbidden ? T.listForbidden : T.listError}</p>
        {!forbidden && (
          <button
            type="button"
            onClick={() => query.refetch()}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            {T.retry}
          </button>
        )}
      </div>
    );
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: Tab = tab === 'pending' ? 'history' : 'pending';
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const items = split[tab];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={T.dialogTitle} className="flex gap-2 border-b border-gray-200">
        {TABS.map((item) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[item.id] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={onTabKeyDown}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === item.id
                ? 'border-[#03548C] text-[#03548C]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${tab}`}
        className="flex flex-col gap-3"
      >
        {items.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {tab === 'pending' ? T.emptyPending : T.emptyHistory}
          </p>
        ) : (
          items.map((request) =>
            props.mode === 'profile' ? (
              <Link
                key={request.publicId}
                href={`/commercial/profile/information-requests/${request.publicId}`}
                className={cardClass}
              >
                <RequestCard request={request} />
              </Link>
            ) : (
              <button
                key={request.publicId}
                type="button"
                onClick={() => props.onSelect(request.publicId)}
                className={cardClass}
              >
                <RequestCard request={request} />
              </button>
            ),
          )
        )}
      </div>
    </div>
  );
}

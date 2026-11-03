'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AlertDataTable } from '@/components/compliance/alerts/AlertDataTable';
import { AlertReviewDialog } from '@/components/compliance/alerts/AlertReviewDialog';
import { CreateRequestDialog } from '@/components/compliance/requests/CreateRequestDialog';
import { Btn } from '@/components/compliance/ui/primitives';
import { alertOriginLabel } from '@/lib/compliance/alerts';
import { casePath, requestDetailPath } from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { TRIGGER_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { Alert } from '@/types/compliance/InformationRequest.types';

type Dialogs = 'review' | 'request' | null;

// El `message` se muestra completo: no se recorta (CA-18).
export function AlertCard({ alert }: { alert: Alert }) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [showData, setShowData] = useState(false);
  const reviewed = alert.reviewedAt !== null;

  return (
    <li className="space-y-2 rounded-xl border border-cmp-rule bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-cmp-ink">
          <Link href={casePath(alert.commercialPublicId, 'tax-profile')} className="text-cmp-azul hover:underline">
            {alert.companyName}
          </Link>
        </p>
        <p className="text-xs text-cmp-slate">{U.detectedOn(formatBogotaDateTime(alert.detectedAt))}</p>
      </div>
      <p className="text-xs text-cmp-slate">
        {alertOriginLabel(alert)} · {TRIGGER_LABELS[alert.trigger]}
      </p>
      <p className="whitespace-pre-line break-words text-sm text-cmp-ink">{alert.message}</p>

      {showData && <AlertDataTable dataUsedJson={alert.dataUsedJson} />}

      {reviewed && (
        <div className="space-y-1 text-sm text-cmp-slate">
          <p>{U.reviewedOn(formatBogotaDateTime(alert.reviewedAt as string))}</p>
          {alert.reviewNotes && <p className="whitespace-pre-line break-words">{U.reviewNoteOf(alert.reviewNotes)}</p>}
          {alert.requestPublicId && (
            <Link href={requestDetailPath(alert.requestPublicId)} className="text-cmp-azul hover:underline">
              {U.viewRequest}
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Btn size="sm" onClick={() => setShowData((v) => !v)} aria-expanded={showData}>
          {showData ? U.hideData : A.alerts.viewData}
        </Btn>
        {!reviewed && (
          <>
            <Btn size="sm" variant="primary" onClick={() => setDialog('request')}>
              {A.alerts.openRequest}
            </Btn>
            <Btn size="sm" onClick={() => setDialog('review')}>
              {A.alerts.markReviewed}
            </Btn>
          </>
        )}
      </div>

      {dialog === 'review' && <AlertReviewDialog alertId={alert.id} onClose={() => setDialog(null)} />}
      {dialog === 'request' && (
        <CreateRequestDialog
          commercialPublicId={alert.commercialPublicId}
          fromAlert={{ id: alert.id, trigger: alert.trigger }}
          onClose={() => setDialog(null)}
        />
      )}
    </li>
  );
}

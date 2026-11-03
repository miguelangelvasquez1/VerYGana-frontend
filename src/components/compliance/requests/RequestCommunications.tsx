import { StatusBadge } from '@/components/shared/StatusBadge';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { COMMUNICATION_CHANNEL_LABELS, DELIVERY_STATUS_LABELS } from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { RequestCommunication } from '@/types/compliance/InformationRequest.types';

// Canal y entrega de cada aviso al empresario. Una entrega fallida avisa de que no se confunda con falta de respuesta.
export function RequestCommunications({ communications }: { communications: RequestCommunication[] }) {
  const failed = communications.some((c) => c.deliveryStatus === 'FAILED');
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-cmp-ink">{U.communicationsTitle}</h2>
      {failed && (
        <p role="alert" className="rounded-lg bg-cmp-hold-bg px-3 py-2 text-sm text-cmp-hold">
          {A.communicationFailedNotice}
        </p>
      )}
      {communications.length === 0 ? (
        <p className="text-sm text-cmp-slate">{U.communicationsEmpty}</p>
      ) : (
        <ul className="space-y-1.5">
          {communications.map((c) => {
            const delivery = DELIVERY_STATUS_LABELS[c.deliveryStatus];
            return (
              <li
                key={`${c.channel}-${c.sentAt}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-cmp-rule bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-cmp-ink">{COMMUNICATION_CHANNEL_LABELS[c.channel]}</span>
                <StatusBadge label={delivery.label} tone={delivery.tone} />
                <span className="text-cmp-slate">{U.sentOn(formatBogotaDateTime(c.sentAt))}</span>
                {c.deliveryStatus === 'FAILED' && c.errorDetail && (
                  <span className="basis-full break-words text-xs text-cmp-hold">{U.deliveryErrorDetail(c.errorDetail)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

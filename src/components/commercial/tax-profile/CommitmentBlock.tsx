import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { INFORMATION_REQUESTS_PATH } from '@/lib/notifications/informationRequestNotifications';
import { commitmentDisplay } from '@/lib/taxProfile/display';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import { CommitmentTextDialog } from './CommitmentTextDialog';

// Compromiso de formalización: solo lectura y sin casilla (RN-2). El texto de "aclaración
// pendiente" lleva a la lista de solicitudes (RN-13).
export function CommitmentBlock({ manifestation }: { manifestation: Manifestation | null }) {
  const display = commitmentDisplay(manifestation);

  return (
    <section
      aria-labelledby="commitment-title"
      className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <h2 id="commitment-title" className="text-sm font-bold text-gray-900">
        Compromiso de formalización
      </h2>
      {display.badge && (
        <div>
          <StatusBadge label={display.badge.label} tone={display.badge.tone} />
        </div>
      )}
      <p className="break-words text-sm text-gray-700">
        {display.pendingClarification ? (
          <Link href={INFORMATION_REQUESTS_PATH} className="font-semibold text-[#03548C] underline">
            {display.text}
          </Link>
        ) : (
          display.text
        )}
      </p>
      <div>
        <CommitmentTextDialog linkText="Leer texto" />
      </div>
    </section>
  );
}

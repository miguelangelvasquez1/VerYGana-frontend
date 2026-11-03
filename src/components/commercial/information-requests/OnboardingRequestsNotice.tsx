'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

import { Dialog } from '@/components/shared/Dialog';
import { usePendingInformationRequestsCount } from '@/hooks/commercial/useInformationRequests';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';

const OnboardingRequestsBrowser = dynamic(
  () => import('./OnboardingRequestsBrowser').then((m) => m.OnboardingRequestsBrowser),
  { ssr: false },
);

// Aviso de solicitudes pendientes dentro del asistente (RN-12). No toca el estado del asistente: las
// solicitudes se ven en un diálogo encima, así el paso conserva lo que el usuario escribió (CA-18).
export function OnboardingRequestsNotice() {
  const { data: count } = usePendingInformationRequestsCount();
  const [open, setOpen] = useState(false);
  // Último conteo mayor que 0: si el usuario responde la última pendiente, el aviso y el diálogo no desaparecen
  // hasta que cierre el diálogo.
  const [lastCount, setLastCount] = useState(0);
  if (count && count !== lastCount) setLastCount(count);

  // Sin pendientes, cargando o con error (D-10): no se muestra nada, salvo con el diálogo abierto.
  if (!count && !open) return null;

  return (
    <>
      <div
        role="status"
        className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm font-semibold text-blue-900">{T.requestsNotice(count || lastCount)}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#03548C] px-4 py-2 text-sm font-bold text-white hover:bg-[#024266]"
        >
          {T.viewRequests}
        </button>
      </div>

      <Dialog open={open} title={T.dialogTitle} onClose={() => setOpen(false)} size="lg">
        <OnboardingRequestsBrowser />
      </Dialog>
    </>
  );
}

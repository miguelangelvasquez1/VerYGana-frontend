'use client';

// Modal global que se abre cuando el backend responde 400 ("Tiene una
// solicitud de cambio de plan en curso...") a una acción de crear/activar un
// activo. Se monta una sola vez en el layout del comercial y escucha el bus
// de `planChangeBlockBus`. No trata el error como genérico: muestra el
// mensaje del backend y ofrece ir a la pantalla de la solicitud.

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRightLeft, X } from 'lucide-react';
import {
  subscribePlanChangeBlocked,
  PLAN_CHANGE_BLOCK_DEFAULT_MESSAGE,
} from '@/lib/api/planChangeBlockBus';
import { useInvalidatePlanChangeRequest } from '@/hooks/planChange/usePlanChangeRequest';
import { PLAN_CHANGE_ROUTE } from './PlanChangeInProgress';

export function PlanChangeBlockedModal() {
  const router = useRouter();
  const pathname = usePathname();
  const invalidatePlanChangeRequest = useInvalidatePlanChangeRequest();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(PLAN_CHANGE_BLOCK_DEFAULT_MESSAGE);

  useEffect(() => {
    return subscribePlanChangeBlocked((msg) => {
      // El estado local de los CTA puede estar desactualizado (otra pestaña):
      // refrescamos la solicitud compartida para que se deshabiliten solos.
      invalidatePlanChangeRequest();
      // Si ya estamos en la pantalla de la solicitud, el 400 es ruido.
      if (pathname?.startsWith(PLAN_CHANGE_ROUTE)) return;
      setMessage(msg);
      setOpen(true);
    });
  }, [pathname, invalidatePlanChangeRequest]);

  if (!open) return null;

  const goToRequest = () => {
    setOpen(false);
    router.push(PLAN_CHANGE_ROUTE);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03548C]/10">
            <ArrowRightLeft className="h-5 w-5 text-[#03548C]" />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-bold text-gray-900">
          Tienes un cambio de plan en curso
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">{message}</p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Entendido
          </button>
          <button
            onClick={goToRequest}
            className="flex-1 cursor-pointer rounded-xl bg-[#03548C] py-2.5 text-sm font-bold text-white transition hover:bg-[#0b1440]"
          >
            Ver solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

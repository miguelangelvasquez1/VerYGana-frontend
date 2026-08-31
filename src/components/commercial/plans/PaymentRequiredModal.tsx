'use client';

// Modal global que se abre cuando el backend responde 402 (saldo
// publicitario en $0) a una acción que consume presupuesto. Se monta una
// sola vez en el layout del comercial y escucha el bus de
// `paymentRequiredBus`. No desloguea ni redirige a un error genérico:
// solo ofrece ir directo al checkout de recarga.

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Wallet, X } from 'lucide-react';
import {
  subscribePaymentRequired,
  PAYMENT_REQUIRED_DEFAULT_MESSAGE,
} from '@/lib/api/paymentRequiredBus';

export function PaymentRequiredModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(PAYMENT_REQUIRED_DEFAULT_MESSAGE);

  useEffect(() => {
    return subscribePaymentRequired((msg) => {
      // Si ya estamos en el flujo de recarga, el 402 es ruido — el propio
      // wizard maneja el estado.
      if (pathname?.startsWith('/commercial/balance')) return;
      setMessage(msg);
      setOpen(true);
    });
  }, [pathname]);

  if (!open) return null;

  const goToRecharge = () => {
    setOpen(false);
    router.push('/commercial/balance');
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
            <Wallet className="h-5 w-5 text-red-500" />
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
          Recarga tu billetera para continuar
        </h2>
        <p className="mt-1.5 text-sm text-gray-500">{message}</p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Ahora no
          </button>
          <button
            onClick={goToRecharge}
            className="flex-1 cursor-pointer rounded-xl bg-[#03548C] py-2.5 text-sm font-bold text-white transition hover:bg-[#0b1440]"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}

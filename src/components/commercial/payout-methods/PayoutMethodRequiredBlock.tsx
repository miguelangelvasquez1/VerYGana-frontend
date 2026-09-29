'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, ArrowRight } from 'lucide-react';

interface PayoutMethodRequiredBlockProps {
  backHref?: string;
  backLabel?: string;
}

/**
 * Bloqueo de página completa para el flujo de creación del primer producto:
 * el comercial necesita un método de pago verificado antes de poder recibir
 * los payouts diarios de sus ventas.
 */
export function PayoutMethodRequiredBlock({ backHref, backLabel }: PayoutMethodRequiredBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className="max-w-md w-full rounded-2xl border border-[#03548C]/30 bg-linear-to-br from-[#03548C]/5 to-[#03548C]/10 px-8 py-10 text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[#03548C]/15">
          <Wallet className="w-6 h-6 text-[#03548C]" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Registra un método de pago verificado
        </h3>
        <p className="text-slate-700 text-sm mb-6 leading-relaxed">
          Antes de crear tu primer producto necesitas registrar y verificar un método de pago.
          Así garantizamos que tus ventas se paguen sin retrasos ni errores.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/commercial/billing"
            className="inline-flex items-center gap-2 bg-[#03548C] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#0b1440] transition-colors shadow-sm"
          >
            Registrar método de pago
            <ArrowRight className="w-4 h-4" />
          </Link>
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-slate-600 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {backLabel ?? 'Volver'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

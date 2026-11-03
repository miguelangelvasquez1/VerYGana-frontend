'use client';

// Avisos persistentes de saldo agotado y de cuenta en pausa. Viven aparte de `WalletBudgetAlerts.tsx` para que el
// layout del comercial los cargue solo cuando el estado del plan los pide (RN-8 de la spec 014).

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, PauseCircle } from 'lucide-react';

/**
 * EXHAUSTED no es "cuenta bloqueada": el plan sigue vigente y todo lo ya
 * creado se puede ver/editar/pausar/archivar con normalidad. El backend no
 * pausa nada y el front tampoco lo simula — solo se restringe crear cosas
 * nuevas que consumen presupuesto.
 *
 * Banner informativo persistente (no oscurece ni bloquea la pantalla).
 */
export function WalletExhaustedBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Tu saldo publicitario se agotó</p>
        <p className="text-xs text-red-700 mt-0.5">
          Recarga para poder crear nuevos anuncios, campañas y encuestas. Lo que ya creaste
          sigue funcionando y puedes seguir viéndolo y editándolo.
        </p>
      </div>
      <Link
        href="/commercial/balance"
        className="shrink-0 inline-flex items-center gap-1.5 self-center text-xs font-bold bg-red-600 text-white px-3 py-1.5 tap rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
      >
        Recargar
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/**
 * DORMANT: la cuenta lleva demasiado tiempo con saldo en $0 y entra en pausa.
 * Aviso más fuerte que `WalletExhaustedBanner` — aquí además de no poder crear
 * tampoco se puede editar. Sigue sin oscurecer ni bloquear la pantalla: ver,
 * pausar/reactivar y el flujo de recarga siguen disponibles.
 */
export function WalletDormantBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-xl">
      <PauseCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-900">Tu cuenta está en pausa por saldo agotado</p>
        <p className="text-xs text-red-800 mt-0.5">
          Llevas demasiado tiempo sin saldo publicitario. Recarga para volver a crear y editar
          tus anuncios, campañas, encuestas y productos. Mientras tanto puedes seguir viéndolos
          y pausar o reactivar lo que ya tenías.
        </p>
      </div>
      <Link
        href="/commercial/balance"
        className="shrink-0 inline-flex items-center gap-1.5 self-center text-xs font-bold bg-red-600 text-white px-3 py-1.5 tap rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
      >
        Recargar
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

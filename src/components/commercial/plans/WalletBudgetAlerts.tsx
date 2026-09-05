'use client';

// components/plans/WalletBudgetAlerts.tsx
// Avisos/bloqueos reutilizables cuando el saldo publicitario de un
// STANDARD/PREMIUM llega a LOW_BALANCE o EXHAUSTED. Distinto de
// LimitReached.tsx (que bloquea por tope de plan, no por saldo).

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Wallet, ArrowRight } from 'lucide-react';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';

export function isWalletExhausted(planState: EffectivePlanStateResponseDTO | null | undefined): boolean {
  return planState?.walletStatus === WalletStatus.EXHAUSTED && planState?.effectivePlan !== PlanCode.BASIC;
}

export function isWalletLow(planState: EffectivePlanStateResponseDTO | null | undefined): boolean {
  return planState?.walletStatus === WalletStatus.LOW_BALANCE && planState?.effectivePlan !== PlanCode.BASIC;
}

/** Banner persistente y bloqueante — saldo en $0, no se pueden crear activos nuevos. */
export function WalletExhaustedBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Tu saldo publicitario está agotado</p>
        <p className="text-xs text-red-700 mt-0.5">
          Recarga tu billetera para seguir creando anuncios, campañas, encuestas y más. Lo que ya creaste sigue funcionando normal.
        </p>
      </div>
      <Link
        href="/commercial/balance"
        className="shrink-0 inline-flex items-center gap-1.5 self-center text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
      >
        Recargar ahora
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/** Aviso suave, no bloqueante — saldo bajo pero todavía disponible. */
export function WalletLowBalanceBanner() {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
      <Wallet size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">Tu saldo publicitario está bajo</p>
        <p className="text-xs text-amber-700 mt-0.5">Recarga pronto para evitar interrupciones en la creación de nuevos activos.</p>
      </div>
      <Link
        href="/commercial/balance"
        className="shrink-0 self-center text-xs font-semibold text-amber-800 underline hover:text-amber-900 whitespace-nowrap"
      >
        Recargar
      </Link>
    </div>
  );
}

/** Mensaje corto para title="" de botones deshabilitados por saldo agotado. */
export const WALLET_EXHAUSTED_TOOLTIP = 'Recarga tu saldo para seguir creando';

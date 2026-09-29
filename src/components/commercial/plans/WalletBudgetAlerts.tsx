'use client';

// components/plans/WalletBudgetAlerts.tsx
// Avisos/bloqueos reutilizables por saldo publicitario de un STANDARD/PREMIUM.
// Dos niveles, de menos a más grave (ver `getBudgetLockLevel`):
//   - EXHAUSTED (budgetSuspended)                    → no crear activos ni exportar PDF.
//   - DORMANT   (budgetSuspended + budgetDormant)     → además, no editar activos.
// El aviso de "saldo bajo" ya no es un estado del wallet: es una alerta
// derivada de umbrales (`type: 'LOW_BALANCE'` en `alerts[]` del resumen del
// dashboard, ver DashboardAlerts.tsx) — no se modela acá.
// Distinto de LimitReached.tsx (que bloquea por tope de plan, no por saldo).

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, PauseCircle } from 'lucide-react';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';

/**
 * Fuente de verdad para bloquear la creación de activos que consumen
 * presupuesto: `budgetSuspended` del backend (plan != BASIC && saldo == 0).
 *
 * Nota: `hasActivePlan` ya NO refleja el saldo — un STANDARD/PREMIUM con
 * saldo $0 devuelve `hasActivePlan: true` + `budgetSuspended: true`. Nunca
 * usar `hasActivePlan` para decidir bloqueos por saldo.
 *
 * Fallback (`walletStatus` + plan) solo por si un backend viejo todavía no
 * envía el flag; BASIC / sin plan nunca aplican.
 */
export function isBudgetSuspended(planState: EffectivePlanStateResponseDTO | null | undefined): boolean {
  if (!planState) return false;
  if (planState.effectivePlan === PlanCode.BASIC || planState.effectivePlan == null) return false;
  if (typeof planState.budgetSuspended === 'boolean') return planState.budgetSuspended;
  return planState.walletStatus === WalletStatus.EXHAUSTED;
}

/**
 * Alias histórico — varios paneles ya importan `isWalletExhausted`. Se
 * mantiene el nombre pero delega en `isBudgetSuspended` para que todos
 * recojan el flag `budgetSuspended` sin tocar cada call site.
 */
export const isWalletExhausted = isBudgetSuspended;

/**
 * Segundo nivel de bloqueo por saldo: la cuenta lleva demasiado tiempo con la
 * billetera en $0 y entra en pausa (DORMANT). Además de lo que ya bloquea
 * `isBudgetSuspended` (crear activos, exportar PDF), en DORMANT tampoco se
 * puede EDITAR activos — solo pausar/reactivar y ver.
 *
 * DORMANT siempre implica suspended, así que exigimos ambos. No hay fallback
 * por `walletStatus` (no es derivable): un backend que no envíe el flag se
 * comporta como el nivel 1 (EXHAUSTED) de siempre.
 */
export function isBudgetDormant(planState: EffectivePlanStateResponseDTO | null | undefined): boolean {
  if (!isBudgetSuspended(planState)) return false;
  return planState?.budgetDormant === true;
}

/** Nivel de bloqueo por saldo, de menos a más grave. */
export type BudgetLockLevel = 'none' | 'exhausted' | 'dormant';

export function getBudgetLockLevel(
  planState: EffectivePlanStateResponseDTO | null | undefined,
): BudgetLockLevel {
  if (isBudgetDormant(planState)) return 'dormant';
  if (isBudgetSuspended(planState)) return 'exhausted';
  return 'none';
}

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
        className="shrink-0 inline-flex items-center gap-1.5 self-center text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
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
        className="shrink-0 inline-flex items-center gap-1.5 self-center text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
      >
        Recargar
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/**
 * Bloqueo de página completa para rutas de edición abiertas directamente
 * (ej. /commercial/products/edit/[id]) cuando la cuenta está en DORMANT.
 */
export function BudgetDormantBlock({
  backHref,
  backLabel,
}: { backHref?: string; backLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className="max-w-md w-full rounded-2xl border-2 border-red-300 bg-linear-to-br from-red-50 to-red-100/40 px-8 py-10 text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-red-500/15">
          <PauseCircle className="w-6 h-6 text-red-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Tu cuenta está en pausa por saldo agotado</h3>
        <p className="text-slate-700 text-sm mb-6 leading-relaxed">
          No puedes editar tus activos mientras la billetera esté agotada. Recarga para volver a
          crear y editar; lo que ya tenías sigue visible y puedes pausarlo o reactivarlo.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/commercial/balance"
            className="inline-flex items-center gap-2 bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Recargar billetera
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

/** Aviso en línea para modales/forms de edición bloqueados por DORMANT. */
export function BudgetDormantEditNotice() {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
      <PauseCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-700">
        Tu cuenta está en pausa por saldo agotado. No puedes editar hasta recargar tu billetera.{' '}
        <Link href="/commercial/balance" className="font-semibold underline hover:text-red-900">
          Recargar
        </Link>
      </p>
    </div>
  );
}

/** Mensaje corto para title="" de botones deshabilitados por saldo agotado. */
export const WALLET_EXHAUSTED_TOOLTIP = 'Recarga tu billetera para crear nuevos activos';

/** Mensaje corto para title="" de botones de edición deshabilitados por DORMANT. */
export const WALLET_DORMANT_TOOLTIP =
  'Tu cuenta está en pausa por saldo agotado. Recarga para volver a editar.';

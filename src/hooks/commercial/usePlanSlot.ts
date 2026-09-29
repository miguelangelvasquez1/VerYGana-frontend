'use client';

// hooks/commercial/usePlanSlot.ts
//
// Selector único para "¿puede el comercial crear / reactivar un activo de este
// tipo, y cuántos van de cuántos?". Combina las 3 fuentes:
//   - planUsage del dashboard  (used YA calculado por el backend — preferente)
//   - EffectivePlanStateResponseDTO  (maxes, canAdvertise/…, budgetSuspended)
//   - solicitud de cambio de plan en curso
// y delega el cálculo en `resolvePlanSlot` (components/commercial/plans/planSlots),
// que aplica EXACTAMENTE las mismas reglas de estado que PlanFeatureGuard.
//
// Uso:
//   const ads = usePlanSlot('ADS');
//   <button disabled={ads.blocked} title={ads.tooltip ?? undefined}>Crear</button>
//   <span>{ads.counterLabel}</span>            // "8 / 10"
//   <button disabled={ads.activate.blocked}>Reactivar</button>
//
// `fallbackUsed` (conteo local con countXOccupyingSlot) solo se usa si el
// dashboard no trajo el slot todavía.

import { usePlanState } from '@/components/commercial/layout/DashboardLayout';
import {
  PlanSlotAsset,
  PlanSlotStatus,
  resolvePlanSlot,
} from '@/components/commercial/plans/planSlots';
import { useCommercialDashboard } from '@/hooks/commercial/useCommercialDashboard';
import { usePlanChangeRequest } from '@/hooks/planChange/usePlanChangeRequest';
import { DEFAULT_DASHBOARD_PERIOD } from '@/services/commercial/DashboardService';

interface UsePlanSlotOptions {
  /** Conteo local con las reglas de estado exactas — se usa solo si el
   *  dashboard aún no trae este slot. */
  fallbackUsed?: number | null;
}

export interface UsePlanSlotResult extends PlanSlotStatus {
  /** Alguna de las 3 fuentes sigue cargando (y no hay dato previo en caché). */
  isLoading: boolean;
}

export function usePlanSlot(
  asset: PlanSlotAsset,
  { fallbackUsed = null }: UsePlanSlotOptions = {},
): UsePlanSlotResult {
  // Comparte queryKey (y caché) con el panel de inicio.
  const { data: dashboard, isLoading: loadingDashboard } =
    useCommercialDashboard(DEFAULT_DASHBOARD_PERIOD);
  const { planState, loadingPlan } = usePlanState();
  const { isBlocking: planChangeBlocked, isLoading: loadingPlanChange } =
    usePlanChangeRequest();

  const status = resolvePlanSlot({
    asset,
    planUsage: dashboard?.planUsage ?? null,
    dashboardPlan: dashboard?.plan ?? null,
    planState,
    planChangeBlocked,
    fallbackUsed,
  });

  return {
    ...status,
    isLoading: loadingDashboard || loadingPlan || loadingPlanChange,
  };
}

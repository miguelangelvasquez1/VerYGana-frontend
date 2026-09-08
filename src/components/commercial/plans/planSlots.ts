// components/commercial/plans/planSlots.ts
//
// Fuente de verdad ÚNICA en el front para "¿cuántos activos ocupan cupo y puede
// el comercial crear/activar uno más?". Replica la lógica del backend
// (PlanFeatureGuard#countSlotOccupying* + PlanGuardAspect) para que el número
// que ve el usuario ("8 / 10") y el bloqueo de los botones coincidan con lo que
// el servidor va a aceptar o rechazar.
//
// Un activo "ocupa cupo" mientras NO esté en un estado terminal. Las listas de
// estados de abajo son las mismas que usa el backend; si cambian allá, cambian
// acá.
//
// Se usa vía `usePlanSlot(asset)` (hooks/commercial/usePlanSlot), que alimenta
// este resolver con:
//   - `planUsage` del dashboard  → GET /commercial/dashboard/summary (used YA
//     calculado por el backend con estas mismas reglas — es lo preferente).
//   - `EffectivePlanStateResponseDTO` → GET /plans/commercial/state (maxes,
//     canAdvertise/…, budgetSuspended). NO trae `used` ni `canSellDirectly`.
//   - si hay una solicitud de cambio de plan en curso.

import {
  DashboardPlan,
  DashboardPlanUsage,
  DashboardSlotType,
} from '@/types/commercial/Dashboard.types';
import { EffectivePlanStateResponseDTO } from '@/types/finance/plans/Plan.types';
import { isBudgetSuspended } from './WalletBudgetAlerts';

// ── Tipo de activo ───────────────────────────────────────────────────────────

/** Los 4 cupos que limita un plan. Coincide con `DashboardPlanUsage.slots[].slot`. */
export type PlanSlotAsset = DashboardSlotType; // 'PRODUCTS' | 'ADS' | 'BRANDED_GAMES' | 'SURVEYS'

/** 'create' = crear un activo nuevo (used >= max bloquea). 'activate' = pasar un
 *  ad APPROVED/PAUSED → ACTIVE: el ad YA ocupa cupo, así que solo se bloquea si
 *  el comercial quedó POR ENCIMA del tope (used > max) tras una bajada de plan. */
export type PlanSlotAction = 'create' | 'activate';

// ── Reglas de estado: qué estados "ocupan cupo" ──────────────────────────────
// (todo estado NO terminal — mismas listas que PlanFeatureGuard en el backend)

/** ADS — AdStatus: PENDING, APPROVED, REJECTED, ACTIVE, PAUSED, COMPLETED, EXPIRED, BLOCKED.
 *  Terminales que NO cuentan: REJECTED, COMPLETED, EXPIRED. */
export const AD_STATUSES_OCCUPYING_SLOT = [
  'PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'BLOCKED',
] as const;

/** PRODUCTS — ProductStatus: ACTIVE, PENDING, REJECTED, INACTIVE.
 *  Terminales que NO cuentan: REJECTED, INACTIVE. */
export const PRODUCT_STATUSES_OCCUPYING_SLOT = ['PENDING', 'ACTIVE'] as const;

/** SURVEYS — SurveyStatus: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ACTIVE, PAUSED, SUSPENDED, COMPLETED.
 *  Terminales que NO cuentan: REJECTED, COMPLETED. */
export const SURVEY_STATUSES_OCCUPYING_SLOT = [
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'SUSPENDED',
] as const;

/** BRANDED_GAMES (parte 1) — CampaignStatus: DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED.
 *  NO cuentan: COMPLETED, CANCELLED. */
export const CAMPAIGN_STATUSES_OCCUPYING_SLOT = ['DRAFT', 'ACTIVE', 'PAUSED'] as const;

/** BRANDED_GAMES (parte 2) — BrandingRequestStatus: DRAFT, PENDING_REVIEW, APPROVED,
 *  REJECTED, DESIGN_IN_PROGRESS, PENDING_ADVERTISER_APPROVAL, CHANGES_REQUESTED,
 *  CAMPAIGN_CREATED, CANCELLED.
 *  NO cuentan: REJECTED, CANCELLED, CAMPAIGN_CREATED (ya representado por su Campaign). */
export const BRANDING_REQUEST_STATUSES_OCCUPYING_SLOT = [
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DESIGN_IN_PROGRESS',
  'PENDING_ADVERTISER_APPROVAL', 'CHANGES_REQUESTED',
] as const;

type WithStatus = { status?: string | null };

function countByStatus(
  items: ReadonlyArray<WithStatus> | null | undefined,
  occupying: readonly string[],
): number {
  if (!items?.length) return 0;
  const set = new Set<string>(occupying);
  return items.reduce((n, it) => (it?.status && set.has(it.status) ? n + 1 : n), 0);
}

/** Cuenta ads que ocupan cupo. Solo fiable si `ads` es la lista COMPLETA (sin
 *  paginar y sin filtrar por estado). Si no, usa `planUsage.used`. */
export const countAdsOccupyingSlot = (ads: ReadonlyArray<WithStatus> | null | undefined) =>
  countByStatus(ads, AD_STATUSES_OCCUPYING_SLOT);

export const countProductsOccupyingSlot = (products: ReadonlyArray<WithStatus> | null | undefined) =>
  countByStatus(products, PRODUCT_STATUSES_OCCUPYING_SLOT);

export const countSurveysOccupyingSlot = (surveys: ReadonlyArray<WithStatus> | null | undefined) =>
  countByStatus(surveys, SURVEY_STATUSES_OCCUPYING_SLOT);

/** usedBrandedGames = (campañas que cuentan) + (branding requests que cuentan). */
export const countBrandedGamesOccupyingSlot = (
  campaigns: ReadonlyArray<WithStatus> | null | undefined,
  brandingRequests: ReadonlyArray<WithStatus> | null | undefined,
) =>
  countByStatus(campaigns, CAMPAIGN_STATUSES_OCCUPYING_SLOT) +
  countByStatus(brandingRequests, BRANDING_REQUEST_STATUSES_OCCUPYING_SLOT);

// ── Resultado del resolver ───────────────────────────────────────────────────

export type PlanSlotBlockReason =
  /** El plan no incluye esta capacidad (!canAdvertise / !canUseSurveys / !canUseGames / !canSellDirectly). */
  | 'CAPABILITY_NOT_IN_PLAN'
  /** Cupo lleno: used >= max (o used > max al reactivar). */
  | 'SLOT_FULL'
  /** Hay una solicitud de cambio de plan abierta. */
  | 'PLAN_CHANGE_IN_PROGRESS'
  /** Saldo publicitario agotado (budgetSuspended). Solo bloquea "crear". */
  | 'BUDGET_SUSPENDED';

export interface PlanSlotActionStatus {
  blocked: boolean;
  reason: PlanSlotBlockReason | null;
  /** Texto corto para `title=""` de un botón deshabilitado. */
  tooltip: string | null;
  /** Texto largo para un banner/aviso en línea. */
  message: string | null;
}

export interface PlanSlotStatus {
  asset: PlanSlotAsset;
  /** Activos que ocupan cupo. `null` si no se pudo determinar (dashboard sin
   *  cargar y sin conteo local). */
  used: number | null;
  /** Tope del plan efectivo (incluye overrides por comercial). `null` si se
   *  desconoce o si es ilimitado (ver `unlimited`). Nunca negativo. */
  max: number | null;
  /** El plan no impone tope para este cupo. */
  unlimited: boolean;
  /** El plan habilita esta capacidad. */
  capable: boolean;
  /** used >= max (sentido "crear"). `false` si no hay datos fiables. */
  full: boolean;
  /** "8 / 10", "8 / ∞" o "8" (o "" si no hay dato). */
  counterLabel: string;

  // Bloqueo para "crear" — también expuesto en la raíz por comodidad.
  create: PlanSlotActionStatus;
  blocked: boolean;
  reason: PlanSlotBlockReason | null;
  tooltip: string | null;
  message: string | null;

  /** Bloqueo para "activar / reactivar" un ad (no aplica BUDGET_SUSPENDED). */
  activate: PlanSlotActionStatus;
}

export interface ResolvePlanSlotParams {
  asset: PlanSlotAsset;
  planUsage?: DashboardPlanUsage | null;
  /** `plan` del dashboard — único sitio con `canSellDirectly`. */
  dashboardPlan?: DashboardPlan | null;
  planState?: EffectivePlanStateResponseDTO | null;
  /** Hay una solicitud de cambio de plan en curso (estado != APPLIED/REJECTED/CANCELLED). */
  planChangeBlocked?: boolean;
  /** Conteo local con las reglas de estado exactas (countXOccupyingSlot). Se usa
   *  SOLO si `planUsage` no trae este slot (dashboard sin cargar/erróneo). */
  fallbackUsed?: number | null;
}

// ── Mensajería ───────────────────────────────────────────────────────────────

const CAPABILITY_TOOLTIP = 'No disponible en tu plan';
const PLAN_CHANGE_TOOLTIP = 'Tienes una solicitud de cambio de plan en curso';
const BUDGET_TOOLTIP = 'Tu saldo publicitario está agotado. Recarga tu billetera.';

function messagesFor(
  reason: PlanSlotBlockReason,
  used: number | null,
  max: number | null,
): { tooltip: string; message: string } {
  switch (reason) {
    case 'CAPABILITY_NOT_IN_PLAN':
      return {
        tooltip: CAPABILITY_TOOLTIP,
        message: 'Esta función no está incluida en tu plan actual. Sube de plan para usarla.',
      };
    case 'SLOT_FULL': {
      const frac = used != null && max != null ? ` (${used}/${max})` : '';
      return {
        tooltip: `Alcanzaste el máximo de tu plan${frac}`,
        message: `Alcanzaste el máximo de tu plan${frac}. Espera a que finalice alguno o sube de plan.`,
      };
    }
    case 'PLAN_CHANGE_IN_PROGRESS':
      return {
        tooltip: PLAN_CHANGE_TOOLTIP,
        message:
          'Tienes una solicitud de cambio de plan en curso. No puedes crear ni reactivar activos hasta resolverla o cancelarla.',
      };
    case 'BUDGET_SUSPENDED':
      return {
        tooltip: BUDGET_TOOLTIP,
        message: 'Tu saldo publicitario está agotado. Recarga tu billetera.',
      };
  }
}

function actionStatus(reason: PlanSlotBlockReason | null, used: number | null, max: number | null): PlanSlotActionStatus {
  if (!reason) return { blocked: false, reason: null, tooltip: null, message: null };
  const { tooltip, message } = messagesFor(reason, used, max);
  return { blocked: true, reason, tooltip, message };
}

// ── Resolver ─────────────────────────────────────────────────────────────────

/** ¿el plan habilita la capacidad detrás de este cupo? */
function resolveCapable(
  asset: PlanSlotAsset,
  slotPresent: boolean,
  planUsageAuthoritative: boolean,
  dashboardPlan: DashboardPlan | null | undefined,
  planState: EffectivePlanStateResponseDTO | null | undefined,
): boolean {
  // El dashboard solo incluye un slot si el plan habilita esa capacidad → si el
  // planUsage llegó (y trae al menos un slot), la ausencia del slot significa
  // que la capacidad NO está incluida.
  if (planUsageAuthoritative) return slotPresent;

  switch (asset) {
    case 'ADS':
      return dashboardPlan?.canAdvertise ?? planState?.canAdvertise ?? true;
    case 'SURVEYS':
      return dashboardPlan?.canUseSurveys ?? planState?.canUseSurveys ?? true;
    case 'BRANDED_GAMES':
      return dashboardPlan?.canUseGames ?? planState?.canUseGames ?? true;
    case 'PRODUCTS':
      // `canSellDirectly` solo existe en el dashboard; sin él no se puede saber
      // → no bloqueamos por capacidad (el backend y el route guard igual lo
      // frenan si no aplica).
      return dashboardPlan?.canSellDirectly ?? true;
  }
}

function maxFromPlanState(
  asset: PlanSlotAsset,
  planState: EffectivePlanStateResponseDTO | null | undefined,
): number | null | undefined {
  switch (asset) {
    case 'ADS': return planState?.maxAds;
    case 'SURVEYS': return planState?.maxSurveys;
    case 'BRANDED_GAMES': return planState?.maxBrandedGames;
    case 'PRODUCTS': return planState?.maxProducts;
  }
}

export function resolvePlanSlot(params: ResolvePlanSlotParams): PlanSlotStatus {
  const { asset, planUsage, dashboardPlan, planState, planChangeBlocked = false, fallbackUsed = null } = params;

  const slot = planUsage?.slots.find((s) => s.slot === asset) ?? null;
  const slotPresent = slot != null;
  // Solo tratamos el planUsage como autoritativo para la capacidad si trae
  // slots; `{ slots: [] }` transitorio no debe bloquear todo por "no incluido".
  const planUsageAuthoritative = (planUsage?.slots.length ?? 0) > 0;

  const capable = resolveCapable(asset, slotPresent, planUsageAuthoritative, dashboardPlan, planState);

  // used
  const used: number | null = slot ? slot.used : fallbackUsed;

  // max: preferimos el del dashboard; si no, el de planState.
  const rawMax = slot ? slot.max : maxFromPlanState(asset, planState);
  const unlimited = rawMax != null && rawMax < 0;
  const max: number | null = rawMax == null || rawMax < 0 ? null : rawMax;

  const canCount = used != null && max != null && !unlimited;
  const fullCreate = canCount && used >= max;
  const overLimit = canCount && used > max;

  // Prioridad de motivo: 1) capacidad  2) cupo  3) cambio de plan  4) saldo.
  // El punto 4 (budgetSuspended) se valida al crear cualquier activo.
  const createReason: PlanSlotBlockReason | null = !capable
    ? 'CAPABILITY_NOT_IN_PLAN'
    : fullCreate
    ? 'SLOT_FULL'
    : planChangeBlocked
    ? 'PLAN_CHANGE_IN_PROGRESS'
    : isBudgetSuspended(planState)
    ? 'BUDGET_SUSPENDED'
    : null;

  // "activar/reactivar" un ad: sin BUDGET_SUSPENDED y el cupo solo bloquea si ya
  // se está por encima del tope (el ad reactivado ya ocupaba cupo).
  const activateReason: PlanSlotBlockReason | null = !capable
    ? 'CAPABILITY_NOT_IN_PLAN'
    : overLimit
    ? 'SLOT_FULL'
    : planChangeBlocked
    ? 'PLAN_CHANGE_IN_PROGRESS'
    : null;

  const create = actionStatus(createReason, used, max);
  const activate = actionStatus(activateReason, used, max);

  const counterLabel =
    used == null
      ? ''
      : unlimited
      ? `${used} / ∞`
      : max != null
      ? `${used} / ${max}`
      : `${used}`;

  return {
    asset,
    used,
    max,
    unlimited,
    capable,
    full: fullCreate,
    counterLabel,
    create,
    blocked: create.blocked,
    reason: create.reason,
    tooltip: create.tooltip,
    message: create.message,
    activate,
  };
}

import { WalletStatus } from "../Wallet.types";

export enum PlanCode {
    BASIC = 'BASIC',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
}

export enum PlanStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    ACTIVE = 'ACTIVE',
    PENDING_FAILED = 'PENDING_FAILED',
    EXPIRED = 'EXPIRED',  
    RENEWED = 'RENEWED',
    CANCELLED = 'CANCELLED',
} 

export interface PlanPaymentRequestDTO {
    planCode: PlanCode;
    amountCents: number;
}

export interface PlanPaymentStatusResponseDTO {
    reference: string;
    wompiStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
    planStatus: PlanStatus; 
    planCode: PlanCode;
    message: string;
}

export interface PlanBenefitsDTO {
    canAdvertise: boolean;
    canUseGames: boolean;
    canUseSurveys: boolean;
    canUsePets: boolean;
    maxProducts: number;
    maxAds: number;
    maxBrandedGames: number;
    maxSurveys: number;
    visibilityBoostPct: number;
}


export interface EffectivePlanStateResponseDTO {
  effectivePlan: PlanCode | null;
  hasActivePlan: boolean;
  remainingBudgetCents: number;       // en centavos
  /**
   * true cuando el plan no es BASIC y el saldo publicitario llegó a 0 → hay
   * que bloquear la creación de activos nuevos que consumen presupuesto.
   * Opcional: si el backend todavía no lo envía, se deriva de
   * `walletStatus === EXHAUSTED && effectivePlan !== BASIC`
   * (ver `isBudgetSuspended` en WalletBudgetAlerts).
   */
  budgetSuspended?: boolean;
  /**
   * Segundo nivel de bloqueo por saldo (STANDARD/PREMIUM). `true` cuando la
   * billetera lleva en $0 más del periodo de gracia del plan (15 días
   * STANDARD, 30 PREMIUM) sin recargar → además de no poder crear activos ni
   * exportar el reporte PDF, tampoco se puede EDITAR activos. Solo
   * pausar/reactivar y ver.
   *
   * `budgetDormant=true` SIEMPRE implica `budgetSuspended=true`. No es
   * derivable de `walletStatus` (sigue siendo `EXHAUSTED`): si el backend no
   * lo envía se trata como `false` (ver `isBudgetDormant`).
   */
  budgetDormant?: boolean;
  commissionRate: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  /**
   * Habilita las pestañas de rendimiento del panel de analíticas
   * (Anuncios, Encuestas, Juegos). Planes Estándar y Premium.
   * Opcional: si el backend no lo envía se trata como `false` (la pestaña
   * se muestra en estado "upsell" en vez de llamar al endpoint de datos).
   */
  canViewPerformanceMetrics?: boolean;
  /**
   * Habilita la pestaña de Remisión (visitas a la página oficial atribuidas
   * a anuncios). Exclusivo del plan Premium.
   * Opcional: si el backend no lo envía se trata como `false`.
   */
  canViewPageVisitMetrics?: boolean;
  maxProducts: number;
  maxAds: number;
  maxBrandedGames: number;
  maxSurveys: number;
  maxKeysPct: number;
  subscriptionDaysRemaining: number | null;  // solo BASIC
  walletStatus: WalletStatus;
}

// Mismo DTO en: onboarding (GET /summary → plan, POST /plan/accept),
// compliance (negociaciones pendientes) y admin (currentPlan del comercial).
export interface PlanSummaryResponseDTO {
    planCode: PlanCode;
    planName: string;
    description: string;
    // Solo aplica a BASIC — null en STANDARD/PREMIUM.
    monthlyFeeCents: number | null;
    // Solo aplican a STANDARD/PREMIUM — null en BASIC.
    minInvestmentCents: number | null;
    maxInvestmentCents: number | null;
    investmentAmountCents: number | null;
    // Solo aplica a BASIC — null en STANDARD/PREMIUM y en BASIC antes de aceptar.
    contractDurationMonths: number | null;
    saleCommissionPct: number;
    // -1 = ilimitado.
    maxKeysPct: number;
    // true mientras haya una negociación especial pendiente (Ruta D o E) —
    // bloquea "Generar contrato" y "Cambiar de plan" hasta que compliance la
    // resuelva.
    requiresSpecialNegotiation: boolean;
    // Cuándo se resolvió la negociación — null si nunca hubo una o sigue
    // pendiente. Si no es null y requiresSpecialNegotiation ya es false, el
    // plan quedó "congelado" (acceptPlan responde 4xx si se intenta cambiar).
    specialNegotiationResolvedAt: string | null;
    specialNegotiationDetails: string | null;
    accepted: boolean | null;
    acceptedAt: string | null;
    grossAmountCents: number | null;
    excludedTaxesCents: number | null;
    benefits: PlanBenefitsDTO | null;
    prosperityThresholdCents: number | null;
}

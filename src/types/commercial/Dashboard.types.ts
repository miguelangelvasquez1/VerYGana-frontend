// Tipos del panel de inicio del comercial.
// Endpoint: GET /commercial/dashboard/summary?period=<PERIODO>
//
// IMPORTANTE sobre montos: todos los campos que terminan en "Cents" vienen en
// CENTAVOS (enteros) — dividir por 100 para mostrar pesos. Excepción:
// `topProducts[].price` ya viene en pesos.
//
// Las secciones que el backend calcula como null se OMITEN del JSON; por eso
// casi todo el objeto raíz es opcional además de nullable — si la clave no
// viene, no se renderiza esa tarjeta/sección.

export type DashboardPeriodType =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH";

export type DashboardPlanCode = "BASIC" | "STANDARD" | "PREMIUM" | "NONE";

export interface DashboardPeriod {
  type: DashboardPeriodType;
  // Fechas ISO yyyy-MM-dd.
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
}

export interface DashboardPlan {
  code: DashboardPlanCode;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  canSellDirectly: boolean;
  canPromoteAllyProducts: boolean;
  canExportReport: boolean;
  budgetSuspended: boolean;
}

export interface DashboardSalesMetrics {
  salesAmountCents: number;
  salesCount: number;
  netEarningsCents: number;
  platformCommissionsCents: number;
}

export interface DashboardSales {
  current: DashboardSalesMetrics;
  previous: DashboardSalesMetrics;
  // Variación % vs. periodo anterior. null => el periodo anterior fue 0 =>
  // mostrar etiqueta "nuevo" en vez de un porcentaje.
  salesAmountDeltaPct: number | null;
  salesCountDeltaPct: number | null;
  netEarningsDeltaPct: number | null;
  platformCommissionsDeltaPct: number | null;
}

export interface DashboardSalesTrendPoint {
  // yyyy-MM-dd
  date: string;
  amountCents: number;
  count: number;
}

export interface DashboardTopProduct {
  id: number;
  name: string;
  imageUrl: string | null;
  // EN PESOS (no en centavos).
  price: number;
  averageRate: number;
  totalSales: number;
}

export interface DashboardEngagementMetric {
  current: number;
  previous: number;
  deltaPct: number | null;
}

export interface DashboardEngagement {
  // Cada sub-bloque viene null si ese canal no aplica al plan.
  adLikes?: DashboardEngagementMetric | null;
  surveyResponses?: DashboardEngagementMetric | null;
  gamePlays?: DashboardEngagementMetric | null;
}

export type DashboardChannel = "MARKETPLACE" | "ADS" | "SURVEYS" | "GAMES";
export type DashboardChannelUnit = "SALES" | "INTERACTIONS";

export interface DashboardChannelBreakdownItem {
  channel: DashboardChannel;
  unit: DashboardChannelUnit;
  value: number;
}

export type DashboardSlotType = "PRODUCTS" | "ADS" | "BRANDED_GAMES" | "SURVEYS";

export interface DashboardPlanUsageSlot {
  slot: DashboardSlotType;
  used: number;
  max: number;
}

export interface DashboardPlanUsage {
  code: DashboardPlanCode;
  // Solo los slots que aplican al plan.
  slots: DashboardPlanUsageSlot[];
}

export interface DashboardActiveAsset {
  id: number;
  title: string;
  status: string;
  // Puede venir null (ej. productos no tienen progreso).
  progressPct: number | null;
  secondaryLabel: string | null;
}

export interface DashboardActiveAssets {
  // Cada lista: máx. 5 elementos; null si esa sección no aplica al plan.
  ads?: DashboardActiveAsset[] | null;
  brandedGames?: DashboardActiveAsset[] | null;
  surveys?: DashboardActiveAsset[] | null;
  products?: DashboardActiveAsset[] | null;
}

export interface DashboardAllyPromotion {
  productId: number;
  productName: string;
  productImageUrl: string | null;
  allyCommercialId: number;
  allyCommercialName: string;
  priceCents: number;
  promotedAt: string;
}

export interface DashboardAllyPromotions {
  promotedCount: number;
  allies: DashboardAllyPromotion[];
}

export type DashboardQuickActionType =
  | "CREATE_AD"
  | "CREATE_SURVEY"
  | "CREATE_BRANDED_GAME"
  | "ADD_PRODUCT"
  | "EXPORT_REPORT"
  | "RECHARGE_WALLET"
  | "MANAGE_ALLIES";

export interface DashboardQuickAction {
  action: DashboardQuickActionType;
  enabled: boolean;
  // Texto para el tooltip cuando enabled === false.
  disabledReason: string | null;
}

export type DashboardAlertType =
  | "ONBOARDING_INCOMPLETE"
  | "PLAN_CHANGE_PENDING"
  | "BUDGET_SUSPENDED"
  | "LOW_BALANCE";

export type DashboardAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface DashboardAlert {
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  message: string;
  // Texto del CTA — puede ser null.
  actionHint: string | null;
}

export interface CommercialDashboardSummary {
  period: DashboardPeriod;
  plan: DashboardPlan;
  // null si plan.canSellDirectly === false (PREMIUM).
  sales?: DashboardSales | null;
  // null si !canSellDirectly. 1 punto por día del rango, ya relleno con ceros.
  salesTrend?: DashboardSalesTrendPoint[] | null;
  // null si !canSellDirectly.
  topProducts?: DashboardTopProduct[] | null;
  // null para BASIC.
  engagement?: DashboardEngagement | null;
  channelBreakdown?: DashboardChannelBreakdownItem[] | null;
  planUsage?: DashboardPlanUsage | null;
  activeAssets?: DashboardActiveAssets | null;
  // null salvo PREMIUM.
  allyPromotions?: DashboardAllyPromotions | null;
  quickActions: DashboardQuickAction[];
  alerts: DashboardAlert[];
}

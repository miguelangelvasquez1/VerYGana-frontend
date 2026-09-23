import { PlanCode } from "./Plan.types";

export interface PlanCatalogOption {
  planCode: PlanCode;
  planName: string;
  description: string;
  recommended: boolean;
  currentPlan: boolean;
  // Solo aplica a BASIC — null en STANDARD/PREMIUM.
  monthlyFeeCents: number | null;
  // Solo aplican a STANDARD/PREMIUM — null en BASIC.
  minInvestmentCents: number | null;
  maxInvestmentCents: number | null;
  // 0 = no aplica al plan. Si ambas vienen > 0 (STANDARD), la que aplica
  // depende de la caracterización Productos/Servicios que asigne VERyGANA.
  saleCommissionPct: number;
  servicesCommissionPct: number;
  // -1 = ilimitado.
  maxKeysPct: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  canUsePets: boolean;
  // -1 = ilimitado.
  maxProducts: number;
  maxAds: number;
  maxBrandedGames: number;
  maxSurveys: number;
  visibilityBoostPct: number;
}

export interface PlanCatalogResponseDTO {
  currentPlanCode: PlanCode | null;
  plans: PlanCatalogOption[];
}

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
  saleCommissionPct: number;
  // -1 = ilimitado.
  maxKeysPct: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  canHavePets: boolean;
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

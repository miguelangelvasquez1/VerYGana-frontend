// types/plans.ts

export interface Plan {
  id: number;
  code: '' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  name: string;
  description: string;
  monthlySubscription: boolean;
  monthlyPrice?: number;
  minInvestment?: number;
  maxInvestment?: number;
}

/**
 * Estado efectivo del anunciante calculado en tiempo real por el backend.
 * Corresponde a EffectivePlanState.java
 */
export interface EffectivePlanState {
  hasActivePlan: boolean;
  effectivePlan: Plan['code'];
  commissionActive: boolean;
  commissionRate: number;
  remainingBudget: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  maxProducts: number;
  maxAds: number;
  maxBrandedGames: number;
  roiReached: boolean;
}
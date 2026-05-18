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


export interface EffectivePlanStateResponseDTO {
  effectivePlan: PlanCode | null;
  hasActivePlan: boolean;
  remainingBudgetCents: number;       // en centavos
  commissionRate: number;
  canAdvertise: boolean;
  canUseGames: boolean;
  canUseSurveys: boolean;
  maxProducts: number;
  maxAds: number;
  maxBrandedGames: number;
  maxSurveys: number;
  maxKeysPct: number;
  subscriptionDaysRemaining: number | null;  // solo BASIC
  walletStatus: WalletStatus;
}

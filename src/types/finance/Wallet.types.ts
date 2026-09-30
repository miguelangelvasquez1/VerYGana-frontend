import { PlanCode } from "./plans/Plan.types";

export enum WalletStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    EXHAUSTED = 'EXHAUSTED',
}



export enum DepositType {
    SUBSCRIPTION = 'SUBSCRIPTION',
    INVESTMENT = 'INVESTMENT'
}

export interface ActivePlan {
    planName: string;
    planCode: PlanCode;
    endDate: string | null;
    daysRemaining: number | null;
    status: WalletStatus | null;
}

export interface BillingSummaryResponseDTO {
    balanceCents: number | null;
    walletStatus: WalletStatus | null;
    spentThisMonthCents: number | null;
    earnedThisMonthCents: number;
    currentPlan: ActivePlan;
}

export interface DepositResponseDTO {
    type: DepositType;
    description: string;
    amountCents: number;
    referenceId: string;
    date: string;
    status: WalletStatus;
}



export interface KeyWalletResponseDTO {
    purchaseKeysCents: number;
    blockedPurchaseKeysCents: number;
    connectivityKeysCents: number;
    blockedConnectivityKeysCents: number;
    updatedAt: string;
}
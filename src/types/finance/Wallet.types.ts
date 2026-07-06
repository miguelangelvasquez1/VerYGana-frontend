import { PlanCode } from "./plans/Plan.types";

export enum WalletStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    LOW_BALANCE = 'LOW_BALANCE',
    EXHAUSTED = 'EXHAUSTED',
}

export enum PayoutStatus {
    PROCESSING = 'PROCESSING',
    SCHEDULED = 'SCHEDULED',
    PAID = 'PAID',
    FAILED = 'FAILED',
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

export interface PayoutSummaryResponseDTO {
    id: string;
    grossAmountCents: number;
    commissionCents: number;
    netAmountCents: number;
    status: PayoutStatus;
    scheduledAt: string;
    paidAt: string;
}
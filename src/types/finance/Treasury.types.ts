import { BankAccountType, DocType } from "../PayoutMethod.types";

export enum CashRefundStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID"
}

export interface TreasuryBalanceResponseDTO {
    keysReserveCents: number;
    fortificationCents: number;
    operationsCents: number;
    payoutsPendingCents: number;
    totalCents: number;
    keysReserveHealthPct: number;
    keysReserveStatus: string;
    hasNegativeBalance: boolean;
}

export interface TreasuryMovementResponseDTO {
    id: string;
    fromAccountCode: string;
    toAccountCode: string;
    amountCents: number;
    concept: string;
    referenceId: string;
    referenceType: string;
    createdAt: string;
}

export interface SubmitCashRefundBankDetailsRequestDTO {
    accountHolderName : string;
    accountHolderDoc : string;
    accountHolderDocType : DocType
    bankName : string;
    accountNumber : string;
    accountType : BankAccountType;
}

export interface CashRefundResponseDTO {
    id : string;
    purchaseItemId : number;
    amountCents : number;
    status : CashRefundStatus;
    accountHolderName : string;
    accountHolderDoc : string;
    accountHolderDocType : DocType;
    accountType : BankAccountType;
    createdAt : string;
    bankDetailsSubmittedAt : string;
    paidAt : string;
}
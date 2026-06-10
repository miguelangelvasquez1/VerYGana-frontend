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
// Espejo de los DTOs de com.verygana2.dtos.prosperity (backend).
// Los campos *Cents vienen en CENTAVOS.

// ACTIVE: STANDARD, absorbe ventas. FROZEN: dejó de ser STANDARD, saldo
// conservado sin absorber. NOT_APPLICABLE: nunca tuvo Umbral y no es STANDARD.
export type ProsperityStatus = 'ACTIVE' | 'FROZEN' | 'NOT_APPLICABLE';

export type ProsperityMovementType =
    | 'THRESHOLD_GENERATED'
    | 'SALE_ABSORPTION'
    | 'REFUND_REINTEGRATION'
    | 'THRESHOLD_REVERSAL'
    | 'ADJUSTMENT_CREDIT'
    | 'ADJUSTMENT_DEBIT';

export interface ProsperityThresholdsResponse {
    id : number;
    investmentId : number;
    investmentNetCents : number;
    multiplier : number;
    generatedCents : number;
    planVersion : number;
    validatedAt : string;
    reversed : boolean;
    reversedAt : string | null;
}

export interface ProsperitySummaryResponseDTO {
    commercialPublicId : string;
    status : ProsperityStatus;
    balanceCents : number;
    accumulatedThresholdCents : number;
    totalAbsorbedCents : number;
    totalReintegratedCents : number;
    thresholds : ProsperityThresholdsResponse[];
    disclaimer : string;
}

export interface ProsperityMovementResponseDTO {
    id : number;
    sequence : number;
    type : ProsperityMovementType;
    amountCents : number;
    balanceBeforeCents : number;
    balanceAfterCents : number;
    originType : string | null;
    originId : string | null;
    thresholdId : number | null;
    relatedEntryId : number | null;
    saleAmountCents : number | null;
    uncoveredCents : number | null;
    effectiveAt : string;
    cause : string | null;
    supportRef : string | null;
    performedBy : string | null;
}

export interface ProsperityReversalResquestDTO {
    cause : string;
    supportRef? : string | null;
}

export interface ProsperityAdjustmentRequestDTO {
    credit : boolean;
    amountCents : number;
    cause : string;
    supportRef? : string | null;
    relatedEntryId? : number | null;
    idempotencyKey : string;
}

export interface ProsperityReconciliationResultDTO {
    accountsChecked : number;
    discrepancies : string[];
}

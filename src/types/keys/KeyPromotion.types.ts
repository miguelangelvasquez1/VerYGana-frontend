// Llaves Promocionales (MP-12).
//
// Convenciones del backend:
//  - `...Cents` -> dinero en centavos de COP.
//  - Sin sufijo `Cents` (availableKeys, usableKeys...) -> cantidad de llaves.
//  - 1 llave = $10 COP = 1.000 centavos.

// ─── Consumidor ──────────────────────────────────────────────────────────────

export interface ActiveKeyPromotionDTO {
    productId: number;
    promotionName: string;
    keysPct: number;
    endsAt: string;
    termsText: string | null;
}

// ─── Ofertas (comercial y detalle del admin) ─────────────────────────────────

export type KeyPromotionOfferStatus = 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type KeyPromotionStatus = 'DRAFT' | 'AUTHORIZED' | 'PAUSED' | 'ENDED';

export interface KeyPromotionOfferDTO {
    offerId: number;
    status: KeyPromotionOfferStatus;
    respondedAt: string | null;
    promotionId: number;
    promotionName: string;
    promotionStatus: KeyPromotionStatus;
    startsAt: string;
    endsAt: string;
    termsText: string | null;
    productId: number;
    productName: string;
    priceCents: number;
    ordinaryKeysPct: number;
    promotionKeysPct: number;
    maxKeysCoverageCents: number;
    minUserCashCents: number;
    commissionPct: number;
    // Calculados como si el empresario NO tuviera Saldo de Prosperidad.
    estimatedCommissionCents: number;       // precio × commissionPct
    estimatedNetToCommercialCents: number;  // precio menos esa comisión
    // Saldo de Prosperidad actual. Solo informativo: no hacer cálculos con él.
    prosperityBalanceCents: number;
}

// ─── Admin: promociones ──────────────────────────────────────────────────────

export interface KeyPromotionRequestDTO {
    name: string;
    coveragePct: number;
    startsAt: string;
    endsAt: string;
    budgetCents: number;
    maxExcessCentsPerUser?: number | null;
    termsText?: string | null;
}

export interface KeyPromotionResponseDTO {
    id: number;
    name: string;
    coveragePct: number;
    startsAt: string;
    endsAt: string;
    status: KeyPromotionStatus;
    configVersion: number;
    termsText: string | null;
    budgetCents: number;
    reservedCents: number;
    consumedCents: number;
    availableBudgetCents: number;
    maxExcessCentsPerUser: number | null;
    guaranteeDrawnCents: number;
    guaranteeReturnedAt: string | null;
    authorizedAt: string | null;
    offers: KeyPromotionOfferDTO[];
}

// ─── Admin: libro de llaves ──────────────────────────────────────────────────

export interface KeyLedgerExpiryResultDTO {
    evaluatedAt: string;
    simulated: boolean;
    walletsWithDueLots: number;
    walletsFailed: number;
    expiredCents: number;
}

export interface KeyLedgerReconciliationResultDTO {
    walletsOutOfSyncWithLedger: Array<string | number>;
    walletsWithLotsAboveBalance: Array<string | number>;
}

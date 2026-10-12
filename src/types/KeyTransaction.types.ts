
export enum KeyTransactionType {
    CREDIT_INTERACTION = 'CREDIT_INTERACTION',
    CREDIT_REFERRAL_BONUS = 'CREDIT_REFERRAL_BONUS',
    CREDIT_ADMIN_ADJUSTMENT = 'CREDIT_ADMIN_ADJUSTMENT',
    CREDIT_COPAYMENT_REFUND = 'CREDIT_COPAYMENT_REFUND',
    RESERVE_COPAYMENT_PENDING = 'RESERVE_COPAYMENT_PENDING',
    DEBIT_COPAYMENT = 'DEBIT_COPAYMENT',
    DEBIT_CONNECTION_RECHARGE = 'DEBIT_CONNECTION_RECHARGE',
    DEBIT_ADMIN_ADJUSTMENT = 'DEBIT_ADMIN_ADJUSTMENT',
    DEBIT_PET_GAME = 'DEBIT_PET_GAME',
    EXPIRED = 'EXPIRED',
    RELEASE_COPAYMENT_CANCELLED = 'RELEASE_COPAYMENT_CANCELLED',
}

export const KEY_TRANSACTION_LABELS: Record<KeyTransactionType, string> = {
    CREDIT_INTERACTION: 'Llaves por interacción',
    CREDIT_REFERRAL_BONUS: 'Bono por referido',
    CREDIT_ADMIN_ADJUSTMENT: 'Ajuste de administrador (entrada)',
    CREDIT_COPAYMENT_REFUND: 'Llaves devueltas por reembolso',
    RESERVE_COPAYMENT_PENDING: 'Llaves reservadas para tu compra',
    DEBIT_COPAYMENT: 'Pago con llaves confirmado',
    DEBIT_CONNECTION_RECHARGE: 'Recarga de conectividad',
    DEBIT_ADMIN_ADJUSTMENT: 'Ajuste de administrador (salida)',
    DEBIT_PET_GAME: 'Compra realizada en mascotas',
    EXPIRED: 'Llaves vencidas',
    RELEASE_COPAYMENT_CANCELLED: 'Llaves devueltas: pago no completado',
};

export const isPositiveKeyType = (type: KeyTransactionType): boolean =>
    type.startsWith('CREDIT') || type.startsWith('RELEASE');

// LEGACY = movimiento anterior a MP-12 (sin saldos posteriores).
export type KeyOriginType =
    | 'AD'
    | 'GAME'
    | 'SURVEY'
    | 'COPAYMENT'
    | 'PURCHASE_ITEM_REFUND'
    | 'PET_GAME'
    | 'EXPIRY'
    | 'ADMIN'
    | 'LEGACY';

export const KEY_ORIGIN_LABELS: Record<KeyOriginType, string> = {
    AD: 'Anuncio',
    GAME: 'Juego',
    SURVEY: 'Encuesta',
    COPAYMENT: 'Compra',
    PURCHASE_ITEM_REFUND: 'Reembolso de compra',
    PET_GAME: 'Mascota',
    EXPIRY: 'Vencimiento',
    ADMIN: 'Administración',
    LEGACY: '',
};

export interface KeyTransactionResponseDTO {
    id: string;
    type: KeyTransactionType;
    originType?: KeyOriginType | null;
    // null en DEBIT_COPAYMENT: el saldo disponible ya bajó en la reserva
    // (RESERVE_COPAYMENT_PENDING) y el monto viene en blockedPurchaseKeysDelta.
    purchaseKeysDelta: number | null;
    connectivityKeysDelta: number | null;
    // Llaves que entran o salen del saldo bloqueado por una compra en curso.
    blockedPurchaseKeysDelta?: number | null;
    reason: string;
    referenceId: string | null;
    expiredAt: Date | null;
    createdAt: Date;
}

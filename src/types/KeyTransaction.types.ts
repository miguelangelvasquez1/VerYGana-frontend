export enum KeyTransactionType {
    CREDIT_INTERACTION = 'CREDIT_INTERACTION',
    CREDIT_REFERRAL_BONUS = 'CREDIT_REFERRAL_BONUS',
    CREDIT_ADMIN_ADJUSTMENT = 'CREDIT_ADMIN_ADJUSTMENT',
    DEBIT_COPAYMENT = 'DEBIT_COPAYMENT',
    DEBIT_CONNECTION_RECHARGE = 'DEBIT_CONNECTION_RECHARGE',
    DEBIT_ADMIN_ADJUSTMENT = 'DEBIT_ADMIN_ADJUSTMENT',
    EXPIRED = 'EXPIRED',
    RELEASE_COPAYMENT_CANCELLED = 'RELEASE_COPAYMENT_CANCELLED',
}

export const KEY_TRANSACTION_LABELS: Record<KeyTransactionType, string> = {
    CREDIT_INTERACTION: 'Llaves por interacción',
    CREDIT_REFERRAL_BONUS: 'Bono por referido',
    CREDIT_ADMIN_ADJUSTMENT: 'Ajuste de administrador (entrada)',
    DEBIT_COPAYMENT: 'Copago de llaves',
    DEBIT_CONNECTION_RECHARGE: 'Recarga de conectividad',
    DEBIT_ADMIN_ADJUSTMENT: 'Ajuste de administrador (salida)',
    EXPIRED: 'Llaves expiradas',
    RELEASE_COPAYMENT_CANCELLED: 'Devolución de copago cancelado',
};

export const isPositiveKeyType = (type: KeyTransactionType): boolean =>
    type.startsWith('CREDIT') || type.startsWith('RELEASE');

export interface KeyTransactionResponseDTO {
    id: string;
    type: KeyTransactionType;
    purchaseKeysDelta: number;
    connectivityKeysDelta: number;
    reason: string;
    referenceId: string | null;
    expiredAt: Date | null;
    createdAt: Date;
}
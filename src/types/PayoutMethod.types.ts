export enum PayoutMethodType {
    BANK_ACCOUNT = 'BANK_ACCOUNT',
    NEQUI = 'NEQUI',
    DAVIPLATA = 'DAVIPLATA'
}

export enum BankAccountType {
    SAVINGS = 'SAVINGS',
    CHECKING = 'CHECKING'
}

export enum DocType {
    CC = 'CC',
    CE = 'CE',
    NIT = 'NIT',
    PP = 'PP',
    TI = 'TI',
    DNI = 'DNI'
}

export enum VerificationStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    AWAITING_OTP = 'AWAITING_OTP',
    UNDER_REVIEW = 'UNDER_REVIEW',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED'
}

export interface PayoutMethodResponse {
    id: string;
    type: PayoutMethodType;
    alias: string;
    bankCode?: string;
    accountNumber?: string;
    bankAccountType?: string;
    phoneNumber?: string;
    accountHolderName: string;
    accountHolderDoc: string;
    accountHolderDocType: DocType;
    verificationStatus: VerificationStatus;
    rejectionReason?: string;
    active: boolean;
    firstPayoutCompleted: boolean;
    createdAt: string;
    verifiedAt?: string;
}
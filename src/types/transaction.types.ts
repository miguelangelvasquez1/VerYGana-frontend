
export interface Transaction {
    id: number;
    referenceId: string;
    amount: number;
    transactionType: string;
    transactionState: string;
    paymentMethod: string;
    createdAt: string;
    completedAt: string | null;
}

export interface TransactionResponseDTO {
    id: number;
    amount: number;
    createdAt: string;
    paymentMethod: string;
    referenceId: string;
    transactionType: string;
    transactionState: string;
}

export interface EarningsByMonthResponseDTO {
    sellerId: number;
    year: number;
    month: number;
    earnings: number;
}


export interface TransactionPayoutResponseDTO {
    id: number;
    referenceId: string;
    createdAt: string;
    amount: number;
    transactionState: string;
}
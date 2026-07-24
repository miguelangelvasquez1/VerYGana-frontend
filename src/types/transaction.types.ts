

export interface EarningsByMonthResponseDTO {
    commercialId: number;
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
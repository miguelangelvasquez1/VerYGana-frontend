
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
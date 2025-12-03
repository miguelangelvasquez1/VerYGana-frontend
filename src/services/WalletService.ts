import apiClient from "@/lib/api/client";

export interface DepositRequest {
    amount : number;
    paymentMethod : string;
}

export interface WithdrawalRequest {
    amount : number;
    paymentMethod: string;
}

export interface TransferRequest {
    amount : number;
    receiverId : number;
}

export interface TransactionResponse {
    message : string;
    amount : number;
    referenceId : string;
    timeStamp : string;
}

export interface WalletResponse {
    balance : number;
    blockedBalance : number;
    lastUpDateTime : string;
}

export const getMyWallet = async (): Promise<WalletResponse> => {
    const response = await apiClient.get('/wallets/myWallet');
    return response.data
};

export const getAvailableBalance = async (): Promise<number> => {
    const response = await apiClient.get('/wallets/balance');
    return response.data;
};

export const getBlockedBalance = async (): Promise<number> => {
    const response = await apiClient.get('/wallets/balance/blocked');
    return response.data;
};

export const doDeposit = async (
    request: DepositRequest
): Promise<TransactionResponse> => {
    const response = await apiClient.post('/wallets/deposit', request);
    return response.data;
};

export const doWithdrawal = async (
    request: WithdrawalRequest
): Promise<TransactionResponse> => {
    const response = await apiClient.post('/wallets/withdraw', request);
    return response.data;
};

export const transferToUser = async (
    request: TransferRequest
): Promise<TransactionResponse> => {
    const response = await apiClient.post('/wallets/transfer', request);
    return response.data;
};

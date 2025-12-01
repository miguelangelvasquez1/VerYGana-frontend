import api from "@/lib/axios";

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
    const response = await api.get('/wallets/myWallet');
    return response.data
};

export const getAvailableBalance = async (): Promise<number> => {
    const response = await api.get('/wallets/balance');
    return response.data;
};

export const getBlockedBalance = async (): Promise<number> => {
    const response = await api.get('/wallets/balance/blocked');
    return response.data;
};

export const doDeposit = async (
    request: DepositRequest
): Promise<TransactionResponse> => {
    const response = await api.post('/wallets/deposit');
    return response.data;
};

export const doWithdrawal = async (
    request: WithdrawalRequest
): Promise<TransactionResponse> => {
    const response = await api.post('/wallets/withdraw');
    return response.data;
};

export const transferToUser = async (
    request: TransferRequest
): Promise<TransactionResponse> => {
    const response = await api.post('/wallets/transfer');
    return response.data;
};

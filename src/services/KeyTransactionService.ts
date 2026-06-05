import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { KeyTransactionResponseDTO, KeyTransactionType } from "@/types/KeyTransaction.types";

export interface KeyTxParams {
    initialDate?: string;
    endDate?: string;
    type?: KeyTransactionType;
    page?: number;
    size?: number;
}

export const getMyKeyTransactions = async (params: KeyTxParams): Promise<PagedResponse<KeyTransactionResponseDTO>> => {
    const query: Record<string, unknown> = {};
    if (params.type) query.type = params.type;
    if (params.initialDate) query.initialDate = `${params.initialDate}T00:00:00Z`;
    if (params.endDate) query.endDate = `${params.endDate}T23:59:59Z`;
    if (params.page !== undefined) query.page = params.page;
    if (params.size) query.size = params.size;

    const response = await apiClient.get("/key-transactions", { params: query });
    return response.data;
};

export const getTotalEarnedKeys = async (): Promise<number> => {
    const response = await apiClient.get("/key-transactions/total-earned-keys");
    return response.data;
};

export const getTotalUsedKeys = async (): Promise<number> => {
    const response = await apiClient.get("/key-transactions/total-used-keys");
    return response.data;
};

export const getTotalExpiredKeys = async (): Promise<number> => {
    const response = await apiClient.get("/key-transactions/total-expired-keys");
    return response.data;
};

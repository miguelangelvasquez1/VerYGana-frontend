import apiClient from "@/lib/api/client";
import { TreasuryBalanceResponseDTO, TreasuryMovementResponseDTO } from "@/types/finance/Treasury.types";
import { PagedResponse } from "@/types/Generic.types";

export const getBalance = async (): Promise<TreasuryBalanceResponseDTO> => {
    const response = await apiClient.get<TreasuryBalanceResponseDTO>("/admin/treasury/balance");
    return response.data;
}

export const getMovements = async (code: string): Promise<PagedResponse<TreasuryMovementResponseDTO>> => {
    const response = await apiClient.get<PagedResponse<TreasuryMovementResponseDTO>>(`/admin/treasury/movements/${code}`);
    return response.data;
}


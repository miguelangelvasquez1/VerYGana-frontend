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

// Porcentaje de reserva de llaves configurado en tesorería (ej. 20 = 20%).
// Accesible para ROLE_ADMIN y ROLE_COMMERCIAL.
export const getKeysReservePct = async (): Promise<number> => {
    const response = await apiClient.get<number>("/admin/treasury/config/keys-reserve-pct");
    return response.data;
}


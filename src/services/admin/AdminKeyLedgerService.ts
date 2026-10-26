import apiClient from "@/lib/api/client";
import { KeyLedgerExpiryResultDTO, KeyLedgerReconciliationResultDTO } from "@/types/keys/KeyPromotion.types";

const BASE_URL = "/admin/key-ledger";

// `asOf` vence las llaves como si fuera esa fecha. Solo para desarrollo: en
// producción el backend responde 422.
export const runExpiry = async (asOf?: string): Promise<KeyLedgerExpiryResultDTO> => {
    const response = await apiClient.post(`${BASE_URL}/expiry`, null, { params: asOf ? { asOf } : undefined });
    return response.data;
}

export const reconcileKeyLedger = async (): Promise<KeyLedgerReconciliationResultDTO> => {
    const response = await apiClient.post(`${BASE_URL}/reconciliation`);
    return response.data;
}

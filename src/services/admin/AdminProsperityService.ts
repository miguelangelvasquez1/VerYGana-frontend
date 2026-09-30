import apiClient from "@/lib/api/client";
import { ProsperityAdjustmentRequestDTO, ProsperityMovementResponseDTO, ProsperityReconciliationResultDTO, ProsperityReversalResquestDTO, ProsperitySummaryResponseDTO } from "@/types/commercial/Prosperity.types";
import { PagedResponse } from "@/types/Generic.types";

const BASE_URL = "/admin/prosperity";

export const getSummary = async (publicId : string) : Promise<ProsperitySummaryResponseDTO> => {
    const response = await apiClient.get(`${BASE_URL}/commercials/${publicId}`);
    return response.data;
}

export const getMovements = async (publicId : string, size: number, page: number) : Promise<PagedResponse<ProsperityMovementResponseDTO>> => {
    const response = await apiClient.get(`${BASE_URL}/commercials/${publicId}/movements`, {
        params: {
            size,
            page
        }
    });
    return response.data;
}

export const reserveThreshold = async (investmentId : number, request : ProsperityReversalResquestDTO) : Promise<ProsperityMovementResponseDTO> => {
    const response = await apiClient.post(`${BASE_URL}/thresholds/${investmentId}/reversal`, request);
    return response.data;
}

export const adjust = async (publicId : string, request : ProsperityAdjustmentRequestDTO) : Promise<ProsperityMovementResponseDTO> => {
    const response = await apiClient.post(`${BASE_URL}/commercials/${publicId}/adjustments`, request);
    return response.data;
}

export const reconcile = async () : Promise<ProsperityReconciliationResultDTO> => {
    const response = await apiClient.post(`${BASE_URL}/reconciliation`);
    return response.data;
}
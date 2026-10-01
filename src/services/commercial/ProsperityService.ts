import apiClient from "@/lib/api/client";
import { ProsperityMovementResponseDTO, ProsperitySummaryResponseDTO } from "@/types/commercial/Prosperity.types";
import { PagedResponse } from "@/types/Generic.types";

const BASE_URL = "/commercial/prosperity";

export const getSummary = async () : Promise<ProsperitySummaryResponseDTO> => {
    const response = await apiClient.get(BASE_URL);
    return response.data;
}

export const getMovements = async (size: number, page: number) : Promise<PagedResponse<ProsperityMovementResponseDTO>> => {
    const response = await apiClient.get(`${BASE_URL}/movements`, {
        params: {
            size,
            page
        }
    });
    return response.data;
} 
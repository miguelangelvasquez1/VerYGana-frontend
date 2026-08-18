import apiClient from "@/lib/api/client";
import { CashRefundResponseDTO } from "@/types/finance/Treasury.types";
import { PagedResponse } from "@/types/Generic.types";

const BASE_URL = "/admin/cash-refunds";

export const getPendingRefunds = async (page: number, size: number) : Promise<PagedResponse<CashRefundResponseDTO>> => {
    const response = await apiClient.get(BASE_URL, {
        params: {
            page,
            size
        }
    });
    return response.data;
}

export const markPaid = async (id : string) : Promise<void> => {
    const response = await apiClient.patch (BASE_URL + `${id}/mark-paid`);
    return response.data;
}
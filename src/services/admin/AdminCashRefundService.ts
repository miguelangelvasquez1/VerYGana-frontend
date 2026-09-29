import apiClient from "@/lib/api/client";
import { CashRefundResponseDTO, CashRefundStatus } from "@/types/finance/Treasury.types";
import { PagedResponse } from "@/types/Generic.types";

const BASE_URL = "/admin/cash-refunds";

export const getRefunds = async (status: CashRefundStatus | undefined, startDate : string | undefined, endDate : string | undefined, page: number, size: number) : Promise<PagedResponse<CashRefundResponseDTO>> => {
    const response = await apiClient.get(BASE_URL, {
        params: {
            status,
            startDate,
            endDate,
            page,
            size
        }
    });
    return response.data;
}

export const getByPurchaseItemId = async (purchaseItemId : number) : Promise<CashRefundResponseDTO> => {
    const response = await apiClient.get(BASE_URL + `/by-purchase-item/${purchaseItemId}`);
    return response.data;
}

export const markPaid = async (id : string) : Promise<void> => {
    const response = await apiClient.patch(BASE_URL + `/${id}/mark-paid`);
    return response.data;
}
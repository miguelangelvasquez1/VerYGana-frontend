import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { PayoutMethodResponseDTO, VerificationStatus } from "@/types/PayoutMethod.types";

const BASE_URL = "/admin/payout-methods";

export const getByStatus = async (status : VerificationStatus, page : number, size : number) : Promise<PagedResponse<PayoutMethodResponseDTO>> => {
    const response = await apiClient.get(BASE_URL, {
        params: {
            status,
            page,
            size
        }
    });
    return response.data;
}

export const verify = async (id : number) : Promise<void> => {
    await apiClient.post(BASE_URL + `/${id}/verify`);
}

export const reject = async (id : number) : Promise<void> => {
    await apiClient.post(BASE_URL + `/${id}/reject`);
}
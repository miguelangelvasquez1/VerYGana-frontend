import apiClient from "@/lib/api/client";
import { SubmitCashRefundBankDetailsRequestDTO } from "@/types/finance/Treasury.types";
import { PagedResponse } from "@/types/Generic.types";
import { PqrsResponseDTO } from "@/types/Pqrs.types";
import { ClaimPurchaseItemRequestDTO, CommercialPendingClaimResponseDTO, FeaturedProductResponseDTO, ReportPurchaseItemRequestDTO } from "@/types/purchases/purchaseItem.types";
import { DocumentType } from "@/types/User.types";


const BASE_URL = "/purchaseItems" 

export const getTotalCommercialSales = async (): Promise<number> => {
    const response = await apiClient.get<number>(BASE_URL + "/totalSales");
    return response.data;
};

export const getTopSellingProductsPage = async (size? : number, page? : number) : Promise<PagedResponse<FeaturedProductResponseDTO>> => {
    const response = await apiClient.get(BASE_URL + "/topSelling", {
        params: {
            size,
            page
        }
    });
    return response.data;
}

export const getDeliveredCode = async (purchaseItemId : number) : Promise<string> => {
    const response = await apiClient.get(BASE_URL + `/${purchaseItemId}/delivered-code`);
    return response.data;
}


//Commercial
export const claimPhysicalItem = async (purchaseItemId : number, request : ClaimPurchaseItemRequestDTO ) : Promise<void> => {
    const response = await apiClient.post(BASE_URL + `/${purchaseItemId}/claim`, request);
    return response.data;
}

export const getPendingClaims = async (documentType? : DocumentType, documentNumber? : string, page? : number, size? : number) : Promise<PagedResponse<CommercialPendingClaimResponseDTO>> => {
    const response = await apiClient.get(BASE_URL + "/pending-claims", {
        params: {
            documentType,
            documentNumber,
            page,
            size
        }
    });
    return response.data;
}

//Consumer
export const reportIssue = async (purchaseItemId : number, request : ReportPurchaseItemRequestDTO) : Promise<PqrsResponseDTO> => {
    const response = await apiClient.post(BASE_URL + `/${purchaseItemId}/report`, request);
    return response.data;
}

export const submitCashRefundBankDetails = async (purchaseItemId : number, request : SubmitCashRefundBankDetailsRequestDTO) : Promise<void> => {
    const response = await apiClient.post(BASE_URL + `/${purchaseItemId}/cash-refund/bank-details`, request);
    return response.data;
}
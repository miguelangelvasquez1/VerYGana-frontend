import apiClient from "@/lib/api/client";
import { BillingSummaryResponseDTO, DepositResponseDTO, PayoutSummaryResponseDTO } from "@/types/finance/Wallet.types";
import { PagedResponse } from "@/types/Generic.types";

export const getBillingSummary = async (): Promise<BillingSummaryResponseDTO> => {
    const response = await apiClient.get<BillingSummaryResponseDTO>("/commercial/wallet/me/billing-summary");
    return response.data;
}

export const getDeposits = async (year: number, month: number, size?: number, page?: number): Promise<PagedResponse<DepositResponseDTO>> => {
    const response = await apiClient.get<PagedResponse<DepositResponseDTO>>("/commercial/wallet/me/deposits", {params: {year, month, size, page}});
    return response.data;
}

export const getPayouts = async (year: number, month: number, size?: number, page?: number): Promise<PagedResponse<PayoutSummaryResponseDTO>> => {
    const response = await apiClient.get<PagedResponse<PayoutSummaryResponseDTO>>("/commercial/wallet/me/payouts", {params: {year, month, size, page}});
    return response.data;
}

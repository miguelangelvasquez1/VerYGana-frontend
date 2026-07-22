import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { EarningsByMonthResponseDTO, TransactionPayoutResponseDTO} from "@/types/transaction.types";

export const getCommercialEarningsByYearList = async (year: number): Promise<EarningsByMonthResponseDTO[]> => {
  const response = await apiClient.get("/transactions/earnings/anually", {
    params: {
      year
    }
  });
  return response.data;
}

export const getTotalEarningsByMonth = async (year: number, month: number): Promise<number> => {
  const response = await apiClient.get("/transactions/earnings/monthly", {
    params: {
      year,
      month
    }
  });
  return response.data;
}

export const getCommercialPayoutsPage = async (year: number, month: number, size?: number, page?: number): Promise<PagedResponse<TransactionPayoutResponseDTO>> => {
  const response = await apiClient.get("/transactions/payouts", {
    params: {
      year,
      month,
      size,
      page
    }
  });
  return response.data;
}

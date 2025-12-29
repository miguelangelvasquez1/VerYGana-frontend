import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/common";
import { TransactionResponseDTO } from "@/types/transaction.types";

export const getMyTransactions = async (): Promise<PagedResponse<TransactionResponseDTO>> => {
  const response = await apiClient.get("/transactions");
  return response.data;
};

export const getTransactionsByFilter = async (
  filter: {
    type?: string;
    state?: string;
    page?: number;
    size?: number;
  }
): Promise<PagedResponse<TransactionResponseDTO>> => {
  const { type, state, ...pageParams } = filter;

  let url = "/transactions";

  if (type) {
    url = `/transactions/type/${type}`;
  }

  if (state) {
    url = `/transactions/state/${state}`;
  }

  const response = await apiClient.get(url, {
    params: pageParams,
  });

  return response.data;
};

export const countTransactionsByType = async (transactionType: string): Promise<number> => {
  const response = await apiClient.get("/transactions/count", { params: { transactionType } });
  return response.data;
};

export const getConsumerEarnings = async (): Promise<number> => {
  const response = await apiClient.get("/transactions/earnings");
  return response.data;
};

export const getByReferenceCode = async (
  code: string,
  page?: number,
  size?: number
): Promise<PagedResponse<TransactionResponseDTO>> => {
  const response = await apiClient.get("/transactions/reference", {
    params: {
      code,
      page,
      size,
    },
  });

  return response.data;
};

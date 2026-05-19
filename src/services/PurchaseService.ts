import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { PurchaseResponseDTO, CreatePurchaseRequestDTO, InitiatePurchaseResponseDTO } from "@/types/purchases/purchase.types";

export const purchaseService = {
  async createPurchase(request: CreatePurchaseRequestDTO): Promise<InitiatePurchaseResponseDTO> {
    const response = await apiClient.post<InitiatePurchaseResponseDTO>('/purchases/buy', request);
    return response.data;
  },

  async getPurchaseById(purchaseId: number): Promise<PurchaseResponseDTO> {
    const response = await apiClient.get<PurchaseResponseDTO>(`/purchases/${purchaseId}`);
    return response.data;
  },

  async getPurchases(page = 0, size = 10): Promise<PagedResponse<PurchaseResponseDTO>> {
    const response = await apiClient.get<PagedResponse<PurchaseResponseDTO>>('/purchases', {
      params: { page, size },
    });
    return response.data;
  },

  async getTotalPurchases(): Promise<number> {
    const response = await apiClient.get<number>('/purchases/totalPurchases');
    return response.data;
  },
};


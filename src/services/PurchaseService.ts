import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/common";
import { Transaction } from "@/types/transaction.types"; 
import { CreatePurchaseItemRequestDTO } from "@/types/cart.types";
import { EntityCreatedResponseDTO } from "@/types/GenericTypes";
import { PurchaseResponseDTO, CreatePurchaseRequestDTO } from "@/types/purchases/purchase.types";

// ===== SERVICE METHODS =====
export const purchaseService = {

    /**
     * Crear una compra
     * POST /purchases/buy
     */
    async createPurchase(request: CreatePurchaseRequestDTO): Promise<EntityCreatedResponseDTO> {
        const response = await apiClient.post<EntityCreatedResponseDTO>("/purchases/buy", request);
        return response.data;
    },

    async getPurchaseById(purchaseId: number): Promise<PurchaseResponseDTO> {
        const response = await apiClient.get<PurchaseResponseDTO>(`/purchases/${purchaseId}`);
        return response.data;
    },
    /**
     * Obtener compras paginadas del consumidor actual
     * GET /purchases?page=0&size=10
     */
    async getPurchases(page: number = 0, size: number = 10): Promise<PagedResponse<PurchaseResponseDTO>> {
        const response = await apiClient.get<PagedResponse<PurchaseResponseDTO>>("/purchases", {
            params: { page, size },
        });
        return response.data;
    },

    /**
     * Obtener transacciones de una compra por ID (solo ADMIN)
     * GET /purchases/{id}/transactions
     */
    async getPurchaseTransactions(purchaseId: number): Promise<Transaction[]> {
        const response = await apiClient.get<Transaction[]>(`/purchases/${purchaseId}/transactions`);
        return response.data;
    },

    async getTotalPurchases(): Promise<number> {
    const response = await apiClient.get<number>("/purchases/totalPurchases");
    return response.data;
  }

};

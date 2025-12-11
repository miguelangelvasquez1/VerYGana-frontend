import apiClient from "@/lib/api/client";

export interface carItem{
    productId: number;
    name: string;
    imageUrl: string;
    price: number;
    quantity: number;

     // Información para el procesado de la compra
    deliveryType: "AUTO" | "MANUAL" | "EXTERNAL_API";
    digitalFormat: "LINK" | "CODE" | "FILE";
    isInstantDelivery: boolean;

    sellerId: number;
    shopName: string;

    // Para validaciones
    stock: number;
}

// ===== DTOs =====
export interface CreatePurchaseItemRequestDTO {
    productId: number;
    quantity: number;
}

export interface CreatePurchaseRequestDTO {
    items: CreatePurchaseItemRequestDTO[];
    contactEmail?: string;
    notes?: string;
    couponCode?: string;
}

export interface EntityCreatedResponse {
    id: number;
    message: string;
    timestamp: string;
}

export interface PagedResponse<T> {
    data: T[];
    meta: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
        sorted: boolean;
    };
}

// Modelo Transaction (según tu backend)
export interface Transaction {
    id: number;
    referenceId: string;
    amount: number;
    transactionType: string;
    transactionState: string;
    paymentMethod: string;
    createdAt: string;
    completedAt: string | null;
}

// Modelo Purchase (puede ajustarse si tienes el DTO exacto)
export interface Purchase {
    id: number;
    createdAt: string;
    totalAmount: number;
    status: string;
    items: any[]; 
}

// ===== SERVICE METHODS =====
export const purchaseService = {

    /**
     * Crear una compra
     * POST /purchases/buy
     */
    async createPurchase(request: CreatePurchaseRequestDTO): Promise<EntityCreatedResponse> {
        const response = await apiClient.post<EntityCreatedResponse>("/purchases/buy", request);
        return response.data;
    },

    /**
     * Obtener compras paginadas del consumidor actual
     * GET /purchases?page=0&size=10
     */
    async getPurchases(page: number = 0, size: number = 10): Promise<PagedResponse<Purchase>> {
        const response = await apiClient.get<PagedResponse<Purchase>>("/purchases", {
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

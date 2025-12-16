import { PurchaseItemResponseDTO, CreatePurchaseItemRequestDTO } from "./purchaseItem.types";


export interface CreatePurchaseRequestDTO {
    items: CreatePurchaseItemRequestDTO[];
    contactEmail?: string;
    notes?: string;
    couponCode?: string;
}

export interface PurchaseResponseDTO {
    id: number;
    referenceId: string;
    items : PurchaseItemResponseDTO[];
    totalItems: number;
    subtotal: number;
    total: number;
    createdAt: string;
    completedAt: string | null;
}
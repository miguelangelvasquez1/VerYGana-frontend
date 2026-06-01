export enum PurchaseItemStatus {
    PENDING = "PENDING",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED"
}

export interface CreatePurchaseItemRequestDTO {
    productId: number;
    quantity: number;
}

export interface PurchaseItemResponseDTO {
    id: number;
    productId: number;
    productName: string;
    imageUrl: string;
}

export interface ConsumerPurchaseItemResponseDTO {
    id: number;
    productId: number;
    productName: string;
    imageUrl: string;
    unitPriceCents: number;
    deliveredCode: string | null;
    deliveredAt: string | null;
    status: PurchaseItemStatus;
    canBeReviewed: boolean;
}

export interface FeaturedProductResponseDTO {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    averageRate: number;
    totalSales: number;
}
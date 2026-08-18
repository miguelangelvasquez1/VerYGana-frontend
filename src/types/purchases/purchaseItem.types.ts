import { MarketPlaceIssueReason } from "../Pqrs.types";

export enum PurchaseItemStatus {
    PENDING = "PENDING",
    CLAIMED = "CLAIMED",
    EXPIRED_UNCLAIMED = "EXPIRED_UNCLAIMED",
    REFUNDED = "REFUNDED",
    CANCELLED = "CANCELLED"
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

export interface ClaimPurchaseItemRequestDTO {
    pin: string;
}

export interface ReportPurchaseItemRequestDTO {
    reason : MarketPlaceIssueReason;
    description: string;
}
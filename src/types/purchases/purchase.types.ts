import { PurchaseItemResponseDTO, ConsumerPurchaseItemResponseDTO, CreatePurchaseItemRequestDTO } from "./purchaseItem.types";

export enum PurchaseStatus {
    PENDING = "PENDING",
    PROCCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}   

export interface InitiatePurchaseResponseDTO {
    purchaseId: number;
    referenceId: string;
    cashAmountCents: number;   // centavos que cobra Wompi
    totalAmountCents: number;  // total en centavos
    keysValueCents: number;    // centavos cubiertos con llaves
    status: string;
    checkoutUrl: string;       // URL de Wompi a donde redirigir
    timestamp: string;
}

export interface CreatePurchaseRequestDTO {
    items: CreatePurchaseItemRequestDTO[];
    keysToUse?: number;      // 0 si no usa llaves
    contactEmail?: string;
    redirectUrl?: string;
}

export interface PurchaseResponseDTO {
    id: number;
    referenceId: string;
    items: PurchaseItemResponseDTO[];
    totalItems: number;
    totalCents: number;
    keyValueCents: number;
    cashCents: number;
    commissionCents: number;
    status: PurchaseStatus;
    createdAt: string;
    completedAt: string | null;
}

export interface ConsumerPurchaseResponseDTO {
    id: number;
    referenceId: string;
    items: ConsumerPurchaseItemResponseDTO[];
    totalItems: number;
    totalCents: number;
    keysValueCents: number;
    cashCents: number;
    status: PurchaseStatus;
    deliveryEmail: string | null;
    createdAt: string;
    completedAt: string | null;
}
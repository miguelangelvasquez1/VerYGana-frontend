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

// POST /purchases/quote — cotiza sin reservar llaves, stock ni presupuesto.
// Devuelve los límites del carrito y el valor de la llave; lo que depende de
// cuántas llaves elige el usuario se calcula en el frontend (siempre con enteros).
export interface PurchaseQuoteRequestDTO {
    items: CreatePurchaseItemRequestDTO[];
}

export interface PurchaseQuoteItemDTO {
    productId: number;
    maxKeysPct: number;              // 50 ordinario o el % de la promoción
    promotionEndsAt: string | null;  // null si rige el tope ordinario
}

export interface PurchaseQuoteResponseDTO {
    totalCents: number;
    availableKeys: number;       // llaves que el usuario puede gastar hoy
    maxApplicableKeys: number;   // tope de la compra
    usableKeys: number;          // máximo aplicable ahora: el menor entre tope, saldo y respaldo
    keyValueCents: number;       // valor de una llave en centavos
    backingSufficient: boolean;  // false si el respaldo es lo que limita usableKeys
    items: PurchaseQuoteItemDTO[];
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
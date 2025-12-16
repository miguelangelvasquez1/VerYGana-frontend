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
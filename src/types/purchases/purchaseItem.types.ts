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

export interface FeaturedProductResponseDTO {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    averageRate: number;
    totalSales: number;
}
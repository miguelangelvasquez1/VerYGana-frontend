export interface CreateProductReviewRequestDTO {
    purchaseItemId : number;
    comment : string;
    rating : number;
}

export interface ProductReviewResponseDTO {
    id : number;
    comment : string;
    rating : number;
    consumerName : string;
    createdAt : string;
}

export interface PurchaseItemToReviewResponseDTO {
    purchaseItemId : number;
    productId : number;
    productName : string;
    productImageUrl : string;
    deliveredCode : string;
    deliveredAt : string;
}

export interface ReviewableProductResponseDTO {
    productId : number;
    purchaseItemId : number;
    productName : string;
    productImageUrl : string;
}

export interface ProductReviewResponseDTO {
  id: number;
  comment: string;
  rating: number;
  consumerName: string;
  createdAt: string;
}

export interface CreateProductReviewRequestDTO {
  purchaseItemId: number;
  comment: string;
  rating: number;
}
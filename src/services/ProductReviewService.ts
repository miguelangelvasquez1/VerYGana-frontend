import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/common";
import { EntityCreatedResponseDTO } from "@/types/GenericTypes";
import { CreateProductReviewRequestDTO, ProductReviewResponseDTO, PurchaseItemToReviewResponseDTO, ReviewableProductResponseDTO } from "@/types/productReview.types";

export const gerProductAvgRating = async (productId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/productsReviews/${productId}/avg`);
    return response.data;
};

export const createProductReview = async (request: CreateProductReviewRequestDTO): Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post<EntityCreatedResponseDTO>("/productsReviews/create", request);
    return response.data;
};

export const getProductReviewsByProductId = async (productId: number, page?: number, size?: number): Promise<PagedResponse<ProductReviewResponseDTO>> => {
    const response = await apiClient.get<PagedResponse<ProductReviewResponseDTO>>(`/productsReviews/${productId}`, {
        params: { page, size }
    });
    return response.data;
};

export const getPendingReviews = async (purchaseId : number): Promise<ReviewableProductResponseDTO[]> => {
    const response = await apiClient.get<ReviewableProductResponseDTO[]>("/productsReviews/pending", {
        params: {purchaseId}
    });
    return response.data;
};

import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { EntityCreatedResponseDTO } from "@/types/Generic.types";
import { CreateProductReviewRequestDTO, ProductReviewResponseDTO, PurchaseItemToReviewResponseDTO, ReviewableProductResponseDTO } from "@/types/productReview.types";

export const gerProductAvgRating = async (productId: number): Promise<number> => {
    const response = await apiClient.get<number>(`/productsReviews/${productId}/avg`);
    return response.data;
};

export const getCommercialAvgRating = async (): Promise<number> => {
    const response = await apiClient.get<number>("/productsReviews/commercial/avg");
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


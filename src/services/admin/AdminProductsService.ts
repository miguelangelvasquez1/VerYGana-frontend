import apiClient from "@/lib/api/client";
import { AssetUploadPermissionDTO, EntityCreatedResponseDTO, FileUploadRequestDTO, PagedResponse } from "@/types/Generic.types";
import { ConfirmProductCategoryCreationRequestDTO } from "@/types/products/ProductCategory.types";
import { ProductResponseDTO, ProductStatus, ProductSummaryResponseDTO } from "@/types/products/Product.types";

export const prepareProductCategoryCreation = async (productCategoryImageMetaData: FileUploadRequestDTO): Promise<AssetUploadPermissionDTO> => {
    const response = await apiClient.post("/api/admin/products/categories/prepare", productCategoryImageMetaData);
    return response.data;
}

export const confirmProductCategoryCreation = async (request: ConfirmProductCategoryCreationRequestDTO): Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post("/api/admin/products/categories/confirm", request);
    return response.data;
}

export const deleteProductCategory = async (productCategoryId: number): Promise<void> => {
    await apiClient.delete(`/api/admin/products/categories/${productCategoryId}`);
}

export const getAllProductsForAdmin = async (status: ProductStatus, page: number, size: number): Promise<PagedResponse<ProductSummaryResponseDTO>> => {
    const response = await apiClient.get("/api/admin/products", { params: { status, page, size } });
    return response.data;
}

export const approveProduct = async (productId: number): Promise<ProductResponseDTO> => {
    const response = await apiClient.post(`/api/admin/products/${productId}/approve`);
    return response.data;
}

export const rejectProduct = async (productId: number, reason : string): Promise<ProductResponseDTO> => {
    const response = await apiClient.post(`/api/admin/products/${productId}/reject`, null, { params: { reason } });
    return response.data;
}

export const deleteProduct = async (productId: number, reason : string): Promise<void> => {
    await apiClient.delete(`/api/admin/products/${productId}`, { params: { reason } });
}
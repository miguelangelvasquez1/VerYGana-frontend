export interface ProductCategoryResponseDTO {
  id: number;
  name: string;
  imageUrl: string;
}

export interface ConfirmProductCategoryCreationRequestDTO {
  productCategoryAssetId: number;
  productCategoryData: CreateProductCategoryRequestDTO;
}

export interface CreateProductCategoryRequestDTO {
  name: string;
}


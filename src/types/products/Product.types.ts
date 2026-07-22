import { OptionalTargetAudienceDTO, TargetAudienceResponseDTO } from "../TargetAudience.types";
import { ProductReviewResponseDTO } from "./ProductReview.types";
import { ProductStockRequestDTO } from "./ProductStock.types";

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  INACTIVE = "INACTIVE"
}

export interface ConfirmProductCreationRequestDTO {
  productAssetId: number;
  productData: CreateProductRequestDTO;
}

export interface ProductSummaryResponseDTO {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  maxKeysAllowed: number;
  maxKeysPct: number;
  minCashCents: number;
  averageRate : number;
  reviewCount : number;
  categoryName : string;
  stock : number;
  status : ProductStatus;
  commercialId: number;
  companyName : string;
  isGameReward : boolean;
}

export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  maxKeysAllowed: number;
  minCashCents: number;
  averageRate : number;
  categoryName : string;
  commercialId: number;
  companyName : string;
  stock : number;
  reviewCount : number;
  reviews : ProductReviewResponseDTO[];
  isGameReward : boolean;
}

export interface ProductEditInfoResponseDTO {
  id: number;
  name: string;
  description: string;
  productCategoryId: number;
  price: number;
  imageUrl: string;
  totalStockItems: number;
  availableStockItems: number;
  targeting: TargetAudienceResponseDTO | null;
}

export interface CreateProductRequestDTO {
  name: string;
  description: string;
  productCategoryId: number;
  price: number;
  stockItems: ProductStockRequestDTO[];
  targeting: OptionalTargetAudienceDTO;
}

export interface UpdateProductRequestDTO {
  name : string;
  description : string;
  productCategoryId : number;
  price : number;
  targeting: OptionalTargetAudienceDTO;
}

export interface ConfirmProductImageUploadRequestDTO {
  newAssetId: number;
}

export interface FilterProductsParams {
  searchQuery?: string;
  categoryId?: number;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  sortBy?: string;
  sortDirection?: string;
}
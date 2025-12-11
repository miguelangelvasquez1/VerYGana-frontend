import { ProductReviewResponseDTO } from "./ProductReview.types";
import { ProductStockRequestDTO } from "./ProductStock.types";

export interface ProductSummaryResponseDTO {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  averageRate : number;
  categoryName : string;
  stock : number;
}

export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  averageRate : number;
  categoryName : string;
  shopName : string;
  stock : number;
  reviewCount : number;
  reviews : ProductReviewResponseDTO[];
}

export interface CreateOrEditProductRequestDTO {
  name: string;
  description: string;
  productCategoryId: number;
  price: number;
  deliveryType: "AUTO" | "MANUAL" | "EXTERNAL_API"; 
  digitalFormat: "LINK" | "CODE" | "FILE"; 
  stockItems: ProductStockRequestDTO[];
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
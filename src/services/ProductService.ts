import api from "@/lib/axios";
import { EntityCreatedResponse } from "@/types/products/types";

export interface CreateOrEditProductRequest {
  name: string;
  description: string;
  categoryId: number;
  imagesUrls: string[];
  stock: number;
  price: number;
}

export interface ProductSummaryResponse {
  id: number;
  name: string;
  price: number;
  mainImageUrl: string;
  rating: number;
  reviewCount: number;
  stock: number;
  categoryName: string;
  sellerName: string;
  isFavorite?: boolean;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imagesUrls: string[];
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Crear nuevo producto (SELLER)
 */
export const createProduct = async (
  data: CreateOrEditProductRequest
): Promise<EntityCreatedResponse> => {
  const response = await api.post('/products/create', data);
  return response.data;
};

/**
 * Editar producto existente (SELLER)
 */
export const editProduct = async (
  productId: number,
  data: CreateOrEditProductRequest
): Promise<void> => {
  await api.put(`/products/edit/${productId}`, data);
};

/**
 * Eliminar producto (SELLER)
 */
export const deleteProduct = async (productId: number): Promise<void> => {
  await api.delete(`/products/delete/${productId}`);
};

/**
 * Eliminar producto como administrador (ADMIN)
 */
export const deleteProductForAdmin = async (productId: number): Promise<void> => {
  await api.delete(`/products/delete/admin/${productId}`);
};

/**
 * Obtener todos los productos con paginación (PÚBLICO)
 */
export const getAllProducts = async (
  page: number = 0
): Promise<PageResponse<ProductSummaryResponse>> => {
  const response = await api.get('/products', {
    params: { page }
  });
  return response.data;
};

/**
 * Filtrar productos con múltiples criterios (PÚBLICO)
 */
export const filterProducts = async (
  params: FilterProductsParams
): Promise<PageResponse<ProductSummaryResponse>> => {
  const response = await api.get('/products/filter', {
    params: {
      searchQuery: params.searchQuery,
      categoryId: params.categoryId,
      minRating: params.minRating,
      maxPrice: params.maxPrice,
      page: params.page ?? 0,
      sortBy: params.sortBy ?? 'createdAt',
      sortDirection: params.sortDirection ?? 'DESC'
    }
  });
  return response.data;
};

/**
 * Obtener detalle completo de un producto (PÚBLICO)
 */
export const getProductDetail = async (productId: number): Promise<ProductResponse> => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

/**
 * Obtener productos de un vendedor específico (PÚBLICO)
 */
export const getSellerProducts = async (
  sellerId: number,
  page: number = 0
): Promise<PageResponse<ProductSummaryResponse>> => {
  const response = await api.get(`/products/${sellerId}`, {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener mis productos como vendedor (SELLER)
 */
export const getMyProducts = async (
  page: number = 0
): Promise<PageResponse<ProductSummaryResponse>> => {
  const response = await api.get('/products/myProducts', {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener productos favoritos (CONSUMER)
 */
export const getFavorites = async (
  page: number = 0
): Promise<PageResponse<ProductSummaryResponse>> => {
  const response = await api.get('/products/favorites', {
    params: { page }
  });
  return response.data;
};

/**
 * Agregar producto a favoritos (CONSUMER)
 */
export const addToFavorites = async (productId: number): Promise<void> => {
  await api.post(`/products/${productId}/favorites`);
};

/**
 * Eliminar producto de favoritos (CONSUMER)
 */
export const removeFromFavorites = async (productId: number): Promise<void> => {
  await api.delete(`/products/${productId}/favorites`);
};
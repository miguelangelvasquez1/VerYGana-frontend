import apiClient from "@/lib/api/client";
import * as ProductTypes from "@/types/products/Product.types";
import { EntityCreatedResponseDTO, EntityUpdatedResponseDTO, PagedResponse } from "@/types/GenericTypes";
import { ProductStockParams, ProductStockRequestDTO, ProductStockResponseDTO } from "@/types/products/ProductStock.types";
// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Crear nuevo producto (SELLER)
 */
export const createProduct = async (
  product: ProductTypes.CreateProductRequestDTO,
  productImage: File
): Promise<EntityCreatedResponseDTO> => {
  const formData = new FormData();

  // Backend espera product como STRING JSON
  formData.append("product", JSON.stringify(product));

  // Imagen
  formData.append("productImage", productImage);

  const response = await apiClient.post("/products/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Eliminar producto (SELLER)
 */
export const deleteProduct = async (productId: number): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

/**
 * Eliminar producto como administrador (ADMIN)
 */
export const deleteProductForAdmin = async (productId: number): Promise<void> => {
  await apiClient.delete(`/products/delete/admin/${productId}`);
};

/**
 * obtener producto existente para editarlo (SELLER)
 */
export const getProductEditInfo = async (productId: number): Promise<ProductTypes.ProductEditInfoResponseDTO> => {
  const response = await apiClient.get(`/products/edit/${productId}`);
  return response.data;
};

/**
 * Editar producto existente (SELLER)
 */
export const editProduct = async (
  productId: number,
  product: ProductTypes.UpdateProductRequestDTO,
  productImage?: File
): Promise<EntityUpdatedResponseDTO> => {

  const formData = new FormData();
  formData.append("product", JSON.stringify(product));

  if (productImage) {
    formData.append("productImage", productImage);
  }

  const response = await apiClient.put(
    `/products/edit/${productId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
  * Obtener el listado de codigos registrados de un producto
  */
export const getProductStock = async (
  productId: number,
  params: ProductStockParams
): Promise<PagedResponse<ProductStockResponseDTO>> => {
  const response = await apiClient.get(
    `/products/${productId}/stock`,
    { params }
  );
  return response.data;
};


/**
  * Agregar un nuevo código de stock
  */
export const addStockItem = async (productId: number, request: ProductStockRequestDTO): Promise<ProductStockResponseDTO> => {
  const response = await apiClient.post(`/products/${productId}/stock`, request);
  return response.data;
}

/**
  * Editar un código de stock específico
  */
export const updateStockItem = async (productId: number, stockId: number, request: ProductStockRequestDTO) => {
  const response = await apiClient.put(`/products/${productId}/stock/${stockId}`, request);
  return response.data;
}

/**
  * Eliminar un código de stock específico
  */
export const deleteStockItem = async (productId : number, stockId : number): Promise<void> => {
  await apiClient.delete(`/products/${productId}/stock/${stockId}`)
}

/**
  * Agregar múltiples códigos de stock de una vez
  */

export const addBulkStockItems = async (productId : number, requests : ProductStockRequestDTO[]) => {
  const response = await apiClient.post(`/products/${productId}/stock/bulk`, requests);
  return response.data;
}

/**
 * Obtener todos los productos con paginación (PÚBLICO)
 */
export const getAllProducts = async (
  page: number = 0
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get('/products', {
    params: { page }
  });
  return response.data;
};

/**
 * Filtrar productos con múltiples criterios (PÚBLICO)
 */
export const filterProducts = async (
  params: ProductTypes.FilterProductsParams
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get('/products/filter', {
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
export const getProductDetail = async (productId: number): Promise<ProductTypes.ProductResponseDTO> => {
  const response = await apiClient.get(`/products/${productId}`);
  return response.data;
};

/**
 * Obtener productos de un vendedor específico (PÚBLICO)
 */
export const getSellerProducts = async (
  sellerId: number,
  page: number = 0
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get(`/products/seller/${sellerId}`, {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener mis productos como vendedor (SELLER)
 */
export const getMyProducts = async (
  page: number = 0
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get('/products/myProducts', {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener la cantidad de productos (SELLER)
 */
export const getTotalSellerProducts = async (): Promise<number> => {
  const response = await apiClient.get('/products/totalProducts');
  return response.data;
};

/**
 * Obtener productos favoritos (CONSUMER)
 */
export const getFavorites = async (
  page?: number
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get('/products/favorites', {
    params: { page }
  });
  return response.data;
};

/**
 * Agregar producto a favoritos (CONSUMER)
 */
export const addToFavorites = async (productId: number): Promise<void> => {
  const response = await apiClient.post(`/products/favorites/${productId}`);
  return response.data;
};

/**
 * Eliminar producto de favoritos (CONSUMER)
 */
export const removeFromFavorites = async (productId: number): Promise<void> => {
  const response = await apiClient.delete(`/products/favorites/${productId}`);
  return response.data;
};

/**
 * Contar productos favoritos (CONSUMER)
 */
export const countFavorites = async (): Promise<number> => {
  const response = await apiClient.get('/products/favorites/count');
  return response.data;
};
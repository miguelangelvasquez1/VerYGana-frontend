import apiClient from "@/lib/api/client";
import * as ProductTypes from "@/types/products/Product.types";
import { AssetUploadPermissionDTO, EntityCreatedResponseDTO, EntityUpdatedResponseDTO, FileUploadPermissionDTO, FileUploadRequestDTO, PagedResponse } from "@/types/Generic.types";
import { ProductStockParams, ProductStockRequestDTO, ProductStockResponseDTO } from "@/types/products/ProductStock.types";

// ============================================
// MÉTODOS DEL SERVICE
// ============================================


/**
 * Preparar la creacion de un producto (COMMERCIAL)
 */
export const prepareProductCreation = async (productImageMetaData: FileUploadRequestDTO): Promise<AssetUploadPermissionDTO> => {
  const response = await apiClient.post("/products/prepare", productImageMetaData);
  return response.data;
};

/** 
 * Crear producto (Luego de confirmar subida a R2)
 */

  export const confirmProductCreation = async (request : ProductTypes.ConfirmProductCreationRequestDTO): Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post("/products/confirm", request);
    return response.data;
  }

/**
 * Eliminar producto (COMMERCIAL)
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
 * obtener producto existente para editarlo (COMMERCIAL)
 */
export const getProductEditInfo = async (productId: number): Promise<ProductTypes.ProductEditInfoResponseDTO> => {
  const response = await apiClient.get(`/products/edit/${productId}`);
  return response.data;
};

/**
 * Editar producto existente (COMMERCIAL)
 */
export const editProduct = async (productId: number, request: ProductTypes.UpdateProductRequestDTO): Promise<EntityUpdatedResponseDTO> => {
  const response = await apiClient.patch(`/products/${productId}`, request);
  return response.data;
}

/**
  * Paso 1 - Preparar actualización de imagen
  */

  export const prepareProductImageUpdate = async (productId: number, imageMetaData: FileUploadRequestDTO): Promise<AssetUploadPermissionDTO> => {
    const response = await apiClient.post(`/products/${productId}/image/prepare`, imageMetaData);
    return response.data;
  }

/**
  * Paso 2 - Confirmar actualización de imagen (luego de subir a R2)
  */

  export const confirmProductImageUpdate = async (productId: number, request: ProductTypes.ConfirmProductImageUploadRequestDTO): Promise<void> => {
    const response = await apiClient.post(`/products/${productId}/image/confirm`, request);
    return response.data;
  }

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
export const deleteStockItem = async (productId: number, stockId: number): Promise<void> => {
  await apiClient.delete(`/products/${productId}/stock/${stockId}`)
}

/**
  * Agregar múltiples códigos de stock de una vez
  */

export const addBulkStockItems = async (productId: number, requests: ProductStockRequestDTO[]) => {
  const response = await apiClient.post(`/products/${productId}/stock/bulk`, requests);
  return response.data;
}

/**
 * Construye la URL del endpoint de imagen privada para productos PENDING/REJECTED.
 * El backend genera un presigned URL fresco (60s) y responde con un redirect 302.
 */
export const buildPrivateImageUrl = (productId: number, token: string | undefined): string | undefined => {
  if (!token) return undefined;
  return `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/private-image?token=${encodeURIComponent(token)}`;
};

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
export const getCommercialProducts = async (
  commercialId: number,
  page: number = 0
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get(`/products/commercial/${commercialId}`, {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener mis productos como vendedor (COMMERCIAL)
 */
export const getMyProducts = async (
  page: number = 0
): Promise<PagedResponse<ProductTypes.ProductSummaryResponseDTO>> => {
  const response = await apiClient.get('/products/my-products', {
    params: { page }
  });
  return response.data;
};

/**
 * Obtener la cantidad de productos (COMMERCIAL)
 */
export const getTotalCommercialProducts = async (status: ProductTypes.ProductStatus): Promise<number> => {
  const response = await apiClient.get('/products/total-products', {
    params: { status }
  });
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

/**
 * Marcar un producto como recompensa de juego (COMMERCIAL)
 */
export const markProductAsReward = async (productId: number): Promise<void> => {
  const response = await apiClient.patch(`/products/${productId}/gameReward`);
  return response.data;
}
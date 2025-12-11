import apiClient from '@/lib/api/client';
import { EntityCreatedResponseDTO } from '@/types/GenericTypes';

// ============================================
// INTERFACES
// ============================================

export interface ProductCategory {
  id: number;
  name: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  imageUrl: string;
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener todas las categorías disponibles (PÚBLICO)
 */
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await apiClient.get('/productCategories');
  return response.data;
};

/**
 * Crear nueva categoría de producto (ADMIN)
 */
export const createProductCategory = async (
  data: CreateProductCategoryRequest
): Promise<EntityCreatedResponseDTO> => {
  const response = await apiClient.post('/productCategories/create', data);
  return response.data;
};

/**
 * Eliminar categoría de producto (ADMIN)
 */
export const deleteProductCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/productCategories/delete/${id}`); // ⬅️ Corregido: Faltaban paréntesis
};
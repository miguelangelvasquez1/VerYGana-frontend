import api from '@/lib/axios';
import { EntityCreatedResponse } from '@/types/products/types';

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
  const response = await api.get('/productCategories');
  return response.data;
};

/**
 * Crear nueva categoría de producto (ADMIN)
 */
export const createProductCategory = async (
  data: CreateProductCategoryRequest
): Promise<EntityCreatedResponse> => {
  const response = await api.post('/productCategories/create', data);
  return response.data;
};

/**
 * Eliminar categoría de producto (ADMIN)
 */
export const deleteProductCategory = async (id: number): Promise<void> => {
  await api.delete(`/productCategories/delete/${id}`); // ⬅️ Corregido: Faltaban paréntesis
};
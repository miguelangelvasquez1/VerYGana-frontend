import apiClient from '@/lib/api/client';

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

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener todas las categorías disponibles (PÚBLICO)
 */
export const getActiveProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await apiClient.get('/productCategories');
  return response.data;
};

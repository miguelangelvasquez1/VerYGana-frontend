// services/CategoryService.ts
import apiClient from "@/lib/api/client";

// ============================================
// INTERFACES
// ============================================
export interface Category {
  id: number;
  name: string;
}

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener todas las categorías disponibles
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get('/categories/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Obtener una categoría por ID
 */
export const getCategoryById = async (categoryId: number): Promise<Category> => {
  const response = await apiClient.get(`/categories/${categoryId}`);
  return response.data;
};

/**
 * Buscar categorías por nombre
 */
export const searchCategories = async (searchTerm: string): Promise<Category[]> => {
  const response = await apiClient.get('/categories/search', {
    params: { query: searchTerm }
  });
  return response.data;
};
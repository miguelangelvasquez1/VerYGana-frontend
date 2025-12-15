// services/CategoryService.ts
import apiClient from "@/lib/api/client";
import { Category } from "@/types/Category.types";

// ============================================
// MÉTODOS DEL SERVICE
// ============================================

/**
 * Obtener todas las categorías disponibles
 */
export const getAllCategories = async (): Promise<Category[] | null> => {
  try {
    const response = await apiClient.get('/categories/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
};

/**
 * Obtener una categoría por ID
 */
export const getCategoryById = async (categoryId: number): Promise<Category | null> => {
  try {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    return null;
  }
};

/**
 * Buscar categorías por nombre
 */
export const searchCategories = async (searchTerm: string): Promise<Category[] | null> => {
  try {
    const response = await apiClient.get('/categories/search', {
      params: { query: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching categories:", error);
    return null;
  }
};
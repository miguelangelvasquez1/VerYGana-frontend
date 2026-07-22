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

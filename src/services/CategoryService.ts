// services/categoryService.ts
import apiClient from '@/lib/api/client';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

class CategoryService {
  // Obtener todas las categorías
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/all');
    return response.data;
  }

  // Obtener todas las categorías (alias para compatibilidad)
  async getCategories(): Promise<Category[]> {
    return this.getAllCategories();
  }

  // Obtener una categoría por ID
  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  }

  // Crear una nueva categoría (admin)
  async createCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const response = await apiClient.post<Category>('/categories/create', data);
    return response.data;
  }

  // Actualizar una categoría (admin)
  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  }

  // Eliminar una categoría (admin)
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();

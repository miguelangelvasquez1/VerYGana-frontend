// lib/api/adService.ts
// using the local `apiClient` declared later in this file

import apiClient from "./client";

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Department {
  code: string;
  name: string;
}

export interface Municipality {
  code: string;
  name: string;
  departmentCode: string;
}

export interface CreateAdRequest {
  title: string;
  description: string;
  rewardPerLike: number;
  maxLikes: number;
  totalBudget: number;
  contentUrl?: string;
  targetUrl?: string;
  categoryIds: number[];
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  startImmediately: boolean;
  endWhenBudgetExhausted: boolean;
  targetAudience: {
    ageRange: [number, number];
    gender: 'all' | 'male' | 'female';
    municipalityCodes: string[];
  };
}

export interface AdResponse {
  id: number;
  title: string;
  description: string;
  rewardPerLike: number;
  maxLikes: number;
  currentLikes: number;
  totalBudget: number;
  spentBudget: number;
  status: string;
  contentUrl?: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

class AdService {
  // Obtener todas las categorías
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories/all');
    return response.data;
  }

  // Obtener todos los departamentos
  async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get<Department[]>('/locations/departments');
    return response.data;
  }

  // Obtener municipios de un departamento
  async getMunicipalities(departmentCode: string): Promise<Municipality[]> {
    const response = await apiClient.get<Municipality[]>(
      `/locations/departments/${departmentCode}/municipalities`
    );
    return response.data;
  }

  // Crear anuncio
  async createAd(data: CreateAdRequest): Promise<AdResponse> {
    const response = await apiClient.post<AdResponse>('/ads', data);
    return response.data;
  }

  // Subir archivo multimedia
  async uploadMedia(adId: number, file: File, type: 'image' | 'video'): Promise<AdResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AdResponse>(
      `/ads/${adId}/media/${type}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Obtener anuncios del usuario
  async getMyAds(page: number = 0, size: number = 10): Promise<{
    content: AdResponse[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/ads/my-ads', {
      params: { page, size }
    });
    return response.data;
  }
}

export const adService = new AdService();
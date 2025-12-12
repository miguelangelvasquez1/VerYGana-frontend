// services/adService.ts
import apiClient from '@/lib/api/client';
import { AdResponseDTO } from '@/types/advertiser';

export interface AdStats {
  totalViews: number;
  totalLikes: number;
  totalClicks: number;
  spentBudget: number;
  remainingBudget: number;
  conversionRate: number;
}

// 🔥 NUEVA INTERFAZ para PagedResponse
interface PagedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    sorted: boolean;
  };
}

class AdService {
  // Crear un nuevo anuncio
  async createAd(formData: FormData): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>('/ads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 🔥 ACTUALIZADO: Obtener todos los anuncios del usuario
  async getMyAds(page: number = 0, size: number = 10): Promise<{
    content: AdResponseDTO[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const response = await apiClient.get<PagedResponse<AdResponseDTO>>('/ads/my-ads/filter', {
      params: { page, size }
    });
    
    return {
      content: response.data.data,
      totalElements: response.data.meta.totalElements,
      totalPages: response.data.meta.totalPages,
      currentPage: response.data.meta.page
    };
  }

  // Obtener un anuncio por ID
  async getAdById(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.get<AdResponseDTO>(`/ads/${id}`);
    return response.data;
  }

  // Actualizar un anuncio
  async updateAd(id: number, formData: FormData): Promise<AdResponseDTO> {
    const response = await apiClient.put<AdResponseDTO>(`/ads/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Eliminar un anuncio
  async deleteAd(id: number): Promise<void> {
    await apiClient.delete(`/ads/${id}`);
  }

  // Pausar un anuncio
  async pauseAd(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.patch<AdResponseDTO>(`/ads/${id}/pause`);
    return response.data;
  }

  // Reanudar un anuncio
  async resumeAd(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.patch<AdResponseDTO>(`/ads/${id}/resume`);
    return response.data;
  }

  // Obtener estadísticas de un anuncio
  async getAdStats(id: number): Promise<AdStats> {
    const response = await apiClient.get<AdStats>(`/ads/${id}/stats`);
    return response.data;
  }

  // 🔥 ACTUALIZADO: Obtener anuncios activos (para usuarios)
  async getActiveAds(page: number = 0, size: number = 10): Promise<{
    content: AdResponseDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<PagedResponse<AdResponseDTO>>('/ads/active', {
      params: { page, size }
    });
    
    return {
      content: response.data.data,
      totalElements: response.data.meta.totalElements,
      totalPages: response.data.meta.totalPages
    };
  }

  // Dar like a un anuncio
  async likeAd(adId: number): Promise<{ success: boolean; reward: number }> {
    const response = await apiClient.post(`/ads/${adId}/like`);
    return response.data;
  }

  // Registrar un clic en el anuncio
  async clickAd(adId: number): Promise<void> {
    await apiClient.post(`/ads/${adId}/click`);
  }
}

export const adService = new AdService();
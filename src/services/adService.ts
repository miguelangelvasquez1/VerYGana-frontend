// services/adService.ts
import apiClient from '@/lib/api/client';

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
  targetUrl?: string;
  mediaType?: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export interface AdStats {
  totalViews: number;
  totalLikes: number;
  totalClicks: number;
  spentBudget: number;
  remainingBudget: number;
  conversionRate: number;
}

class AdService {
  // Crear un nuevo anuncio
  async createAd(formData: FormData): Promise<AdResponse> {
    const response = await apiClient.post<AdResponse>('/ads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Obtener todos los anuncios del usuario
  async getMyAds(page: number = 0, size: number = 10): Promise<{
    content: AdResponse[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const response = await apiClient.get('/ads/my-ads', {
      params: { page, size }
    });
    return response.data;
  }

  // Obtener un anuncio por ID
  async getAdById(id: number): Promise<AdResponse> {
    const response = await apiClient.get<AdResponse>(`/ads/${id}`);
    return response.data;
  }

  // Actualizar un anuncio
  async updateAd(id: number, formData: FormData): Promise<AdResponse> {
    const response = await apiClient.put<AdResponse>(`/ads/${id}`, formData, {
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
  async pauseAd(id: number): Promise<AdResponse> {
    const response = await apiClient.patch<AdResponse>(`/ads/${id}/pause`);
    return response.data;
  }

  // Reanudar un anuncio
  async resumeAd(id: number): Promise<AdResponse> {
    const response = await apiClient.patch<AdResponse>(`/ads/${id}/resume`);
    return response.data;
  }

  // Obtener estadísticas de un anuncio
  async getAdStats(id: number): Promise<AdStats> {
    const response = await apiClient.get<AdStats>(`/ads/${id}/stats`);
    return response.data;
  }

  // Obtener anuncios activos (para usuarios)
  async getActiveAds(page: number = 0, size: number = 10): Promise<{
    content: AdResponse[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/ads/active', {
      params: { page, size }
    });
    return response.data;
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
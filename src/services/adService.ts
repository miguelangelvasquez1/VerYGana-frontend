import apiClient from '@/lib/api/client';
import { AdDetails, AdForAdminDTO, AdForConsumerDTO, AdLikeDTO, AdResponseDTO, AdUpdateDTO, AdUploadPermission, AssetAnalysisResult, FileUploadRequestDTO } from '@/types/ads/commercial';
import { PagedResponse } from '@/types/Generic.types';

export interface AdStats {
  totalViews: number;
  totalLikes: number;
  totalClicks: number;
  spentBudget: number;
  remainingBudget: number;
  conversionRate: number;
}

class AdService {
  private _token: string | null = null;

  /** Called by useAdUpload to keep the token fresh for keepalive requests. */
  setAuthToken(token: string | null): void {
    this._token = token;
  }

  // Crear un nuevo anuncio
  // async createAd(formData: FormData): Promise<AdResponseDTO> {
  //   const response = await apiClient.post<AdResponseDTO>('/ads', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  //   return response.data;
  // }

  // Obtener todos los anuncios del usuario
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

   // Obtener todos los anuncios (Admin) - con filtros
  async getAllAds(
    page: number = 0, 
    size: number = 20,
    status?: string
  ): Promise<{
    content: AdForAdminDTO[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params: any = { page, size };
    if (status && status !== 'all') {
      params.status = status.toUpperCase();
    }

    const response = await apiClient.get<PagedResponse<AdForAdminDTO>>('/ads/admin/all', {
      params
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
  async updateAd(id: number, updateDto: AdUpdateDTO): Promise<AdResponseDTO> {
    const response = await apiClient.put<AdResponseDTO>(`/ads/${id}`, updateDto, {
      headers: {
        'Content-Type': 'application/json',
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
    const response = await apiClient.post<AdResponseDTO>(`/ads/${id}/pause`);
    return response.data;
  }

  // Activar un anuncio
  async resumeAd(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(`/ads/${id}/activate`);
    return response.data;
  }

  // Obtener estadísticas de un anuncio
  async getAdStats(id: number): Promise<AdStats> {
    const response = await apiClient.get<AdStats>(`/ads/${id}/stats`);
    return response.data;
  }

  // Obtener anuncios activos (para usuarios)
  async getActiveAds(page: number = 0, size: number = 10): Promise<{
    content: AdForConsumerDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<PagedResponse<AdForConsumerDTO>>('/ads/user/available', {
      params: { page, size }
    });
    
    return {
      content: response.data.data,
      totalElements: response.data.meta.totalElements,
      totalPages: response.data.meta.totalPages
    };
  }

  // Obtener anuncios pendientes de aprobación (Admin)
  // async getPendingAds(page: number = 0, size: number = 10): Promise<{
  //   content: AdResponseDTO[];

  // ==================== SERVICES FOR ADMIN ====================

  async activateAdAsAdmin(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(
      `/ads/admin/${id}/activate`
    );

    return response.data;
  }

  async pauseAdAsAdmin(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(
      `/ads/admin/${id}/pause`
    );

    return response.data;
  }

  // Bloquear un anuncio
  async blockAd(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(`/ads/admin/${id}/block`);
    return response.data;
  }

  // Aprobar anuncio (Admin)
  async approveAd(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(`/ads/admin/${id}/approve`);
    return response.data;
  }

  // Rechazar anuncio (Admin)
  async rejectAd(id: number, reason: string): Promise<AdResponseDTO> {
    const response = await apiClient.post<AdResponseDTO>(`/ads/admin/${id}/reject`, {
      reason
    });
    return response.data;
  }

  async getNextAd(): Promise<AdForConsumerDTO | null> {
    try {
      const res = await apiClient.get('/adLike/next');
      return res.data;
    } catch (e: any) {
      if (e.response?.status === 204) {
        return null;
      }
      throw e;
    }
  }

  async likeAd(adId: number, sessionUUID: string): Promise<{
    liked: boolean;
    rewardAmount: number;
  }> {
  // Dar like a un anuncio (handled by likeAd method above)
    const response = await apiClient.post(`/adLike/like`, {
      sessionUUID,
      adId
    });
    return response.data;
  }

  // Registrar un clic en la url de un anuncio IMPLEMENTAR
  async clickAd(adId: number): Promise<void> {
    await apiClient.post(`/ads/${adId}/click`);
  }

  async getAdDetails(id: number): Promise<AdResponseDTO> {
    const response = await apiClient.get<AdResponseDTO>(`/ads/${id}/details`);
    return response.data;
  }

  async getAdLikes(id: number, page: number, size = 10): Promise<PagedResponse<AdLikeDTO>> {
    const response = await apiClient.get<PagedResponse<AdLikeDTO>>(
      `/adLike/${id}/likes`,
      { params: { page, size } }
    );
    return response.data;
  }

  async analyzeAsset(assetId: number): Promise<AssetAnalysisResult> {
    const { data } = await apiClient.post<AssetAnalysisResult>(`/ads/assets/${assetId}/analyze`);
    return data;
  }

  async orphanAsset(assetId: number): Promise<void> {
    await apiClient.post(`/ads/assets/orphan/${assetId}`);
  }

  orphanAssetKeepAlive(assetId: number): void {
    console.log("Toekn:" + this._token);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/assets/orphan`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(this._token? { Authorization: `Bearer ${this._token}` } : {}),
      },
      body: JSON.stringify({assetId,}),
    }).catch(() => {});
  }

  /**
   * PASO 1: Preparar la subida del asset (obtener pre-signed URL)
   * Este endpoint devuelve el assetId y la URL para subir a R2
   */
  async prepareAdAssetUpload(
    request: FileUploadRequestDTO
  ): Promise<AdUploadPermission> {
    const response = await apiClient.post<AdUploadPermission>(
      '/ads/assets/prepare-upload',
      request
    );
    return response.data;
  }

  /**
   * PASO 2: Crear el anuncio con el assetId y los detalles
   * Se llama después de que el archivo se haya subido exitosamente a R2
   */
  async createAd(assetId: number, adDetails: AdDetails): Promise<{ id: number }> {
    const response = await apiClient.post<{ id: number }>('/ads', {
      assetId, ...adDetails,
    });
    return response.data;
  }
}

export const adService = new AdService();
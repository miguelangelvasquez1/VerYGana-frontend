// services/campaignService.ts
import { extractErrorMessage } from '@/helpers/ErrorHelper';
import apiClient from '@/lib/api/client';
import {
  Game,
  GameAssetDefinition,
  CreateCampaignRequest,
  Campaign,
  AssetUploadPermission,
  CampaignDetails
} from '@/types/campaigns';
import { PagedResponse } from '@/types/common';

class CampaignService {
  // ==================== Juegos ====================
  
  async getGames(
    page: number = 0,
    size: number = 10
  ): Promise<{
    content: Game[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const response = await apiClient.get<PagedResponse<Game>>('/campaigns/games', {
      params: { page, size },
    });

    return {
      content: response.data.data,
      totalElements: response.data.meta.totalElements,
      totalPages: response.data.meta.totalPages,
      currentPage: response.data.meta.page,
    };
  }

  async getGameById(gameId: number): Promise<Game> {
    const response = await apiClient.get<Game>(`/games/${gameId}`);
    return response.data;
  }

  async getGameAssetDefinitions(gameId: number): Promise<GameAssetDefinition[]> {
    const response = await apiClient.get<GameAssetDefinition[]>(
      `/campaigns/${gameId}/asset-definitions`
    );
    return response.data;
  }

  // ==================== Preparación de Assets ====================

  /**
   * PASO 1: Preparar assets y obtener pre-signed URLs
   */
  async prepareAssetUploads(
    request: CreateCampaignRequest
  ): Promise<AssetUploadPermission[]> {
    try {
    const response = await apiClient.post<AssetUploadPermission[]>(
      '/campaigns/prepare',
      request
    );

    return response.data;
    } catch (error: any) {
      const backendMessage = extractErrorMessage(error);

      throw new Error(backendMessage);
    }
  }

  // ==================== Creación de Campaña ====================

  /**
   * PASO 2: Confirmar creación de campaña con assets ya subidos
   */
  async createCampaign(
    gameId: number,
    assetIds: number[],
    campaignDetails: CampaignDetails
  ): Promise<boolean> {

    try {
      const payload = {
        assetIds,
        budget: campaignDetails.budget,
        targetUrl: campaignDetails.targetUrl,
        categoryIds: campaignDetails.categoryIds,
        minAge: campaignDetails.targetAudience.minAge,
        maxAge: campaignDetails.targetAudience.maxAge,
        targetGender: campaignDetails.targetAudience.gender.toUpperCase(),
        targetMunicipalityCodes: campaignDetails.targetAudience.municipalityCodes
      };

      const response = await apiClient.post<{data: boolean;}>(
        '/campaigns/create',
        payload,
        {
          params: { gameId },
        }
      );

      console.log('📥 Response de create:', response);

      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return response.data.data;
      }

      return response.data;

    } catch (error: any) {
      // ⬅️ AQUÍ está la clave
      const backendMessage = extractErrorMessage(error);

      console.error('❌ Error createCampaign:', backendMessage);

      // relanza SOLO el mensaje
      throw new Error(backendMessage);
    }
  }

  // ==================== Gestión de Campañas ====================

  async getMyCampaigns(page = 0, size = 10): Promise<Campaign[]> {
    const response = await apiClient.get<Campaign[]>('/campaigns');
    return response.data;
  }

  async updateCampaign(
    campaignId: number,
    payload: CampaignDetails
  ): Promise<void> {
    await apiClient.put(`/campaigns/${campaignId}`, payload);
  }

  async updateCampaignStatus(
    campaignId: number,
    status: string
  ): Promise<void> {
    await apiClient.patch(
      `/campaigns/update-status/${campaignId}`,
      { status }
    );
  }
}

export const campaignService = new CampaignService();
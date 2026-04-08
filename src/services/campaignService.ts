// services/campaignService.ts
import { extractErrorMessage } from '@/helpers/ErrorHelper';
import apiClient from '@/lib/api/client';
import {
  Game,
  GameAssetDefinition,
  Campaign,
  AssetUploadPermission,
  CampaignDetails
} from '@/types/games/campaigns';
import { PagedResponse } from '@/types/Generic.types';

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
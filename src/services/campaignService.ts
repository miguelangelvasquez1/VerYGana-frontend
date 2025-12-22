// services/campaignService.ts
import apiClient from '@/lib/api/client';
import {
  Game,
  GameAssetDefinition,
  AssetUploadPermission,
  CreateCampaignRequest,
  CampaignResponse,
  Campaign
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
    const response = await apiClient.get<PagedResponse<Game>>('/games', {
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

  async prepareAssetUploads(
    request: CreateCampaignRequest
  ): Promise<Record<number, AssetUploadPermission>> {
    const response = await apiClient.post<Record<number, AssetUploadPermission>>(
      '/campaigns/prepare',
      request
    );
    return response.data;
  }

  // ==================== Upload a R2 ====================

  async uploadAssetToR2(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Configurar progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });
  }

  // ==================== Creación de Campaña ====================

  async createCampaign(
    gameId: number,
    advertiserId: number,
    uploadedAssets: Record<number, string>
  ): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(
      `/campaigns/create`,
      uploadedAssets,
      {
        params: { gameId, advertiserId }
      }
    );
    return response.data;
  }

  // ==================== Gestión de Campañas ====================

  async getCampaigns(
    page: number = 0,
    size: number = 10
  ): Promise<{ content: Campaign[]; totalElements: number; totalPages: number }> {
    const response = await apiClient.get('/campaigns', {
      params: { page, size }
    });
    return response.data;
  }

  async getCampaignById(campaignId: number): Promise<Campaign> {
    const response = await apiClient.get<Campaign>(`/campaigns/${campaignId}`);
    return response.data;
  }

  async updateCampaignStatus(
    campaignId: number,
    active: boolean
  ): Promise<Campaign> {
    const response = await apiClient.patch<Campaign>(
      `/campaigns/${campaignId}/status`,
      { active }
    );
    return response.data;
  }

  async deleteCampaign(campaignId: number): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}`);
  }

  async getCampaignStats(campaignId: number): Promise<{
    impressions: number;
    clicks: number;
    ctr: number;
    spent: number;
  }> {
    const response = await apiClient.get(`/campaigns/${campaignId}/stats`);
    return response.data;
  }
}

export const campaignService = new CampaignService();
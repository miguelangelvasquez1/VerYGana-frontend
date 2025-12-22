import apiClient from '@/lib/api/client';
import { AssetUploadPermissionDTO, CreateCampaignRequestDTO } from '../types/games/campaign.types';
import { GameAssetDefinitionDTO } from '@/types/games/game.types';

export const prepareCampaign = async (request: CreateCampaignRequestDTO):
    Promise<Record<number, AssetUploadPermissionDTO>> => {
    const response = await apiClient.post('campaigns/prepare', request);
    return response.data;
}

export const createCampaign = async (gameId: number, uploadedAssets: Record<number, string>):
    Promise<boolean> => {
    const response = await apiClient.post('campaigns/create', gameId, uploadedAssets);
    return response.data;
}

export const getAssetDefinitions = async (gameId: number): Promise<GameAssetDefinitionDTO[]> => {
    const response = await apiClient.get('/campaigns/{gameId}/asset-definitions')
    return response.data;
}
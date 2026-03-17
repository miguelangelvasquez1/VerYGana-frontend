import apiClient from '@/lib/api/client';

/**
 * Campaign API Client
 * Handles campaign CRUD operations
 */

export interface CreateCampaignRequest {
  gameId: number;

  budget: number;
  coinValue: number;
  completionCoins: number;
  budgetCoins: number;
  maxCoinsPerSession: number;
  maxSessionsPerUserPerDay: number;

  targetUrl?: string | null;
  categoryIds: number[];

  targetAudience: {
    minAge: number;
    maxAge: number;
    gender: 'ALL' | 'MALE' | 'FEMALE';
    municipalityCodes: string[];
  };

  configData: Record<string, any>;

  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignConfigRequest {
  configData: any;
}

export interface CampaignResponse {
  id: number;
  name: string;
  description?: string;
  gameId: number;
  gameName: string;
  configData: any;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Create new campaign
 */
async function createCampaign(
  request: CreateCampaignRequest
): Promise<CampaignResponse> {
  const response = await apiClient.post<CampaignResponse>(
    '/campaigns',
    request
  );

  return response.data;
}

/**
 * Update campaign configuration
 */
async function updateCampaignConfig(
  campaignId: number,
  request: UpdateCampaignConfigRequest
): Promise<CampaignResponse> {
  const response = await apiClient.put<CampaignResponse>(
    `/campaigns/${campaignId}/config`,
    request
  );

  return response.data;
}

/**
 * Get campaign by ID
 */
async function getCampaign(campaignId: number): Promise<CampaignResponse> {
  const response = await apiClient.get<CampaignResponse>(
    `/campaigns/${campaignId}`
  );

  return response.data;
}

/**
 * List all campaigns
 */
async function listCampaigns(): Promise<CampaignResponse[]> {
  const response = await apiClient.get<CampaignResponse[]>(
    '/campaigns'
  );

  return response.data;
}

export const campaignApi = {
  createCampaign,
  updateCampaignConfig,
  getCampaign,
  listCampaigns
};

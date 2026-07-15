import apiClient from '@/lib/api/client';
import type { BrandingCategory, BrandingMunicipality } from '@/services/BrandingRequestService';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface CampaignSummary {
  id: number;
  gameTitle: string | null;
  budgetCents: number;
  spentCents: number | null;
  status: CampaignStatus;
  completedSessions: number | null;
  uniquePlayersCount: number | null;
}

export interface Campaign {
  id: number;
  brandingRequestId: number;
  brandName: string | null;
  gameId: number;
  gameTitle: string | null;
  campaignGoal: string | null;
  maxSessionsPerUserPerDay: number | null;
  budgetCents: number;
  spentCents: number | null;
  estimatedSessions: number | null;
  costPerSessionCents: number | null;
  sessionsPlayed: number | null;
  completedSessions: number | null;
  totalPlayTimeSeconds: number | null;
  uniquePlayersCount: number | null;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  categories: BrandingCategory[];
  minAge: number | null;
  maxAge: number | null;
  targetGender: 'ALL' | 'MALE' | 'FEMALE' | null;
  targetMunicipalities: BrandingMunicipality[];
}

export interface UpdateCampaignDto {
  maxSessionsPerUserPerDay?: number;
  categoryIds?: number[];
  targetAudience?: {
    minAge?: number;
    maxAge?: number;
    gender?: 'ALL' | 'MALE' | 'FEMALE';
    municipalityCodes?: string[];
  };
}

export const getCampaigns = async (signal?: AbortSignal): Promise<CampaignSummary[]> => {
  const { data } = await apiClient.get('/campaigns', { signal });
  return data;
};

export const getCampaignDetail = async (campaignId: number, signal?: AbortSignal): Promise<Campaign> => {
  const { data } = await apiClient.get(`/campaigns/${campaignId}`, { signal });
  return data;
};

export const updateCampaign = async (campaignId: number, dto: UpdateCampaignDto): Promise<void> => {
  await apiClient.put(`/campaigns/${campaignId}`, dto);
};

export const updateCampaignStatus = async (campaignId: number, status: CampaignStatus): Promise<void> => {
  await apiClient.patch(`/campaigns/update-status/${campaignId}`, { status });
};

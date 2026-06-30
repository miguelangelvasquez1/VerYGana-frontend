import apiClient from '@/lib/api/client';
import type {
  BrandingCategory,
  BrandingComment,
  BrandingCorporateResource,
  BrandingMunicipality,
  BrandingStatus,
} from './BrandingRequestService';

export type { BrandingComment };

export interface DesignerProfile {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  designerCode: string;
  campaignsDesigned: number;
}

export interface DesignerBrandingSummary {
  id: number;
  status: BrandingStatus;
  commercialName: string;
  brandName: string;
  gameName: string;
  estimatedSessions: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameSchema {
  jsonSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

export interface DesignerBrandingDetail {
  id: number;
  status: BrandingStatus;

  // Marca
  commercialName: string;
  brandName: string;
  brandDescription: string;
  targetUrl: string | null;
  campaignGoal: string | null;

  // Juego
  gameId: number;
  gameName: string;
  gameFrontPageUrl: string | null;

  // Segmentación
  minAge: number | null;
  maxAge: number | null;
  targetGender: 'ALL' | 'MALE' | 'FEMALE' | null;
  categories: BrandingCategory[];
  targetMunicipalities: BrandingMunicipality[];

  // Recompensas
  completionRewardCents: number | null;
  maxRewardPerSessionCents: number | null;
  maxSessionsPerUserPerDay: number | null;

  // Comunicación
  adminNotes: string | null;

  // Recursos y configuración
  corporateResources: BrandingCorporateResource[];
  gameSchema: GameSchema | null;
  gameConfig: Record<string, unknown> | null;
  draftFormData: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const resetDesignerPassword = async (
  email: string,
  designerCode: string,
  newPassword: string
): Promise<void> => {
  await apiClient.post('/game-designers/password/reset', { email, designerCode, newPassword });
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getDesignerProfile = async (signal?: AbortSignal): Promise<DesignerProfile> => {
  const { data } = await apiClient.get('/game-designers/me', { signal });
  return data;
};

export const updateDesignerProfile = async (dto: {
  bio?: string;
}): Promise<DesignerProfile> => {
  const { data } = await apiClient.patch('/game-designers/me', dto);
  return data;
};

export const changeDesignerPassword = async (dto: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await apiClient.patch('/game-designers/me/password', dto);
};

// ─── Requests ─────────────────────────────────────────────────────────────────

export const getDesignerRequests = async (
  signal?: AbortSignal
): Promise<DesignerBrandingSummary[]> => {
  const { data } = await apiClient.get('/game-designers/me/branding-requests', { signal });
  return data;
};

export const getDesignerRequestDetail = async (
  id: number,
  signal?: AbortSignal
): Promise<DesignerBrandingDetail> => {
  const { data } = await apiClient.get(`/game-designers/me/branding-requests/${id}`, { signal });
  return data;
};

export const saveDraft = async (
  id: number,
  formData: Record<string, unknown>
): Promise<void> => {
  await apiClient.patch(`/game-designers/me/branding-requests/${id}/draft`, formData);
};

export const submitDesign = async (id: number): Promise<void> => {
  await apiClient.post(`/game-designers/me/branding-requests/${id}/submit-design`);
};

export const getDesignerPreviewUrl = async (id: number): Promise<string> => {
  const { data } = await apiClient.get(`/game-designers/me/branding-requests/${id}/preview-url`);
  return data.url;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const getDesignerComments = async (id: number, signal?: AbortSignal): Promise<BrandingComment[]> => {
  const { data } = await apiClient.get(`/game-designers/me/branding-requests/${id}/comments`, { signal });
  return data;
};

export const postDesignerComment = async (id: number, content: string): Promise<BrandingComment> => {
  const { data } = await apiClient.post(`/game-designers/me/branding-requests/${id}/comments`, { content });
  return data;
};

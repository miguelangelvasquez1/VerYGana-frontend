import apiClient from '@/lib/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PetRequestStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PetRequest {
  id: number;
  productName: string;
  description: string;
  imageObjectKey: string;
  imageUrl?: string;
  desiredEffects: string;
  status: PetRequestStatus;
  rejectionReason?: string;
  resultCatalogItemId?: number;
  createdAt: string;
  updatedAt: string;
  commercialName?: string;
}

export interface PetCatalogItemBody {
  name: string;
  description: string;
  imageObjectKey: string;
  effects: string;
}

export interface SubmitPetRequestBody {
  productName: string;
  description: string;
  imageObjectKey: string;
  desiredEffects: string;
}

// ── Game Designer ─────────────────────────────────────────────────────────────

export const getGameDesignerPetRequests = async (
  status: PetRequestStatus = 'PENDING'
): Promise<PetRequest[]> => {
  const { data } = await apiClient.get('/game-designer/pet/requests', { params: { status } });
  return data;
};

export const markPetRequestInReview = async (id: number): Promise<void> => {
  await apiClient.patch(`/game-designer/pet/requests/${id}/review`);
};

export const approvePetRequest = async (
  id: number,
  body: PetCatalogItemBody
): Promise<void> => {
  await apiClient.post(`/game-designer/pet/requests/${id}/approve`, body);
};

export const rejectPetRequest = async (
  id: number,
  reason: string
): Promise<void> => {
  await apiClient.post(`/game-designer/pet/requests/${id}/reject`, { reason });
};

// ── Commercial ────────────────────────────────────────────────────────────────

export const submitPetRequest = async (
  body: SubmitPetRequestBody
): Promise<PetRequest> => {
  const { data } = await apiClient.post('/commercial/pet/requests', body);
  return data;
};

export const getMyPetRequests = async (): Promise<PetRequest[]> => {
  const { data } = await apiClient.get('/commercial/pet/requests');
  return data;
};

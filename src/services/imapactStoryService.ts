import apiClient from '@/lib/api/client';
import type {
  CreateImpactStoryRequest,
  ImpactStoryFilters,
  ImpactStoryListResponse,
  ImpactStoryResponse,
  UpdateImpactStoryRequest,
} from '@/types/impactStory.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrepareMediaUploadRequest {
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PrepareMediaUploadResponse {
  mediaAssetId: string;
  permission: {
    uploadUrl: string;
    publicUrl: string;
  };
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const impactStoryKeys = {
  all: ['impact-stories'] as const,
  lists: () => [...impactStoryKeys.all, 'list'] as const,
  list: (filters: ImpactStoryFilters) =>
    [...impactStoryKeys.lists(), filters] as const,
  details: () => [...impactStoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...impactStoryKeys.details(), id] as const,
};

// ─── API Functions ────────────────────────────────────────────────────────────

async function getImpactStoriesForConsumer(
  filters: ImpactStoryFilters = {}
): Promise<ImpactStoryListResponse> {
  const response = await apiClient.get<ImpactStoryListResponse>(
    '/impact-stories/consumer',
    { params: filters }
  );
  return response.data;
}

async function getImpactStories(
  filters: ImpactStoryFilters = {}
): Promise<ImpactStoryListResponse> {
  const response = await apiClient.get<ImpactStoryListResponse>(
    '/impact-stories',
    { params: filters }
  );
  return response.data;
}

async function getImpactStoryById(id: number): Promise<ImpactStoryResponse> {
  const response = await apiClient.get<ImpactStoryResponse>(
    `/impact-stories/${id}`
  );
  return response.data;
}

/**
 * PASO 1 del flujo de media:
 * Solicita al backend un mediaAssetId + pre-signed URL para subir a R2/CDN.
 * Se llama UNA VEZ por cada archivo antes de subirlo.
 */
async function prepareMediaAssetUpload(
  request: PrepareMediaUploadRequest
): Promise<PrepareMediaUploadResponse> {
  try {
    const response = await apiClient.post<PrepareMediaUploadResponse>(
      '/impact-stories/media/prepare-upload',
      request
    );
    return response.data;

  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al preparar la carga del archivo';
    throw new Error(message);
  }
  
}

/**
 * PASO 3 del flujo de media:
 * Crea la historia con los IDs de assets ya subidos a R2.
 * Se llama DESPUÉS de confirmar que todos los uploads fueron exitosos.
 */
async function createImpactStory(
  request: CreateImpactStoryRequest
): Promise<ImpactStoryResponse> {
  try {
    const response = await apiClient.post<ImpactStoryResponse>(
      '/impact-stories',
      request
    );
  return response.data;

  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al crear la historia de impacto';
    throw new Error(message);
  }
}

async function updateImpactStory(
  request: UpdateImpactStoryRequest
): Promise<ImpactStoryResponse> {
  try {
    const { id, ...body } = request;
    const response = await apiClient.put<ImpactStoryResponse>(
      `/impact-stories/${id}`,
      body
    );
    return response.data;
    
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar la historia de impacto';
    throw new Error(message);
  }
}

async function deleteImpactStory(id: number): Promise<void> {
  await apiClient.delete(`/impact-stories/${id}`);
}

export const impactStoryApi = {
  getImpactStories,
  getImpactStoryById,
  prepareMediaAssetUpload,
  createImpactStory,
  updateImpactStory,
  deleteImpactStory,
  getImpactStoriesForConsumer,
};
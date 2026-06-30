import apiClient from '@/lib/api/client';
import { FileUploadPermissionDTO } from '@/types/Generic.types';

export interface AssetUploadPermissionDTO {
  assetId: number;
  temporalUrl: string;
  publicUrl: string;
  permission: FileUploadPermissionDTO;
}

export interface DesignerAssetUploadRequest {
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  brandingRequestId: number;
}

export interface AssetConfirmRequest {
  assetId: number;
  previousAssetId?: number;
}

async function requestUploadUrl(
  request: DesignerAssetUploadRequest
): Promise<AssetUploadPermissionDTO> {
  try {
    const response = await apiClient.post<AssetUploadPermissionDTO>(
      "/game-designers/me/assets/upload-url",
      request
    );

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Error solicitando URL de carga";

    throw new Error(message);
  }
}

/**
 * Confirm upload completion to backend
 */
async function confirmUpload(
  request: AssetConfirmRequest
): Promise<void> {
  try {
    await apiClient.post("/game-designers/me/assets/confirm", request);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Error confirmando carga";

    throw new Error(message);
  }
}

async function deleteAsset(assetId: number): Promise<void> {
  try {
    await apiClient.delete(`/game-designers/me/assets/${assetId}`);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 403) throw new Error('No tienes permiso para eliminar este asset');
    if (status === 404) throw new Error('El asset no existe');
    if (status === 400) throw new Error('El asset ya fue eliminado');
    throw new Error(error.response?.data?.message || 'Error al eliminar el asset');
  }
}

export const uploadAsset = {
  requestUploadUrl,
  confirmUpload,
  deleteAsset,
};

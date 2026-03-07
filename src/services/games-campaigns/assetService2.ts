import apiClient from '@/lib/api/client';
import { FileUploadRequest } from '@/types/games/campaigns';
import { FileUploadPermission } from '@/types/GenericTypes';

/**
 * Asset API Client
 * Handles presigned URL generation and upload confirmation
 */

export interface AssetUploadPermissionDTO {
  assetId: number;
  temporalUrl: string;
  publicUrl: string;
  permission: FileUploadPermission;
}

export interface AssetConfirmRequest {
  assetId: number;
}

/**
 * Request presigned upload URL from backend
 */
async function requestUploadUrl(
  request: FileUploadRequest
): Promise<AssetUploadPermissionDTO> {
  try {
    const response = await apiClient.post<AssetUploadPermissionDTO>(
      "/campaigns/assets/upload-url",
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
    await apiClient.post("/campaigns/assets/confirm", request);
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      "Error confirmando carga";

    throw new Error(message);
  }
}

export const uploadAsset = {
  requestUploadUrl,
  confirmUpload
};

export interface FileUploadRequestDTO {
    originalFileName: string;
    contentType: string;
    sizeBytes: number;
}
export interface CreateAssetRequestDTO {
    assetDefinitionId: number;
    // campaignId: number;
    fileMetadata: FileUploadRequestDTO;
}
export interface CreateCampaignRequestDTO {
    gameId: number;
    assets: CreateAssetRequestDTO [];
}
export interface AssetUploadPermissionDTO {
    uploadUrl: string;
    publicUrl : string;
    expiresInSeconds: number;
}
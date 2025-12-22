// hooks/campaigns/useCampaignUpload.ts
import { useState, useCallback } from 'react';
import { campaignService } from '@/services/campaignService';
import {
  FileWithPreview,
  CreateAssetRequest,
  UploadState,
  GameAssetDefinition,
} from '@/types/campaigns';

interface UseCampaignUploadProps {
  gameId: number;
  advertiserId: number;
  onSuccess?: (campaignId: number) => void;
  onError?: (error: string) => void;
}

export function useCampaignUpload({
  gameId,
  advertiserId,
  onSuccess,
  onError,
}: UseCampaignUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });

  const updateFileProgress = useCallback(
    (
      files: Map<number, FileWithPreview[]>,
      definitionId: number,
      fileName: string,
      updates: Partial<FileWithPreview>
    ) => {
      const newFiles = new Map(files);
      const fileList = newFiles.get(definitionId);
      if (fileList) {
        const index = fileList.findIndex((f) => f.file.name === fileName);
        if (index !== -1) {
          fileList[index] = { ...fileList[index], ...updates };
          newFiles.set(definitionId, [...fileList]);
        }
      }
      return newFiles;
    },
    []
  );

  const uploadCampaign = useCallback(
    async (
      files: Map<number, FileWithPreview[]>,
      assetDefinitions: GameAssetDefinition[],
      setFiles: React.Dispatch<React.SetStateAction<Map<number, FileWithPreview[]>>>
    ) => {
      try {
        setUploadState({ status: 'preparing', progress: 0 });

        // PASO 1: Preparar assets request
        const assetsToUpload: CreateAssetRequest[] = [];
        files.forEach((fileList, defId) => {
          fileList.forEach((f) => {
            assetsToUpload.push({
              assetDefinitionId: defId,
              fileMetadata: {
                originalFileName: f.file.name,
                contentType: f.file.type,
                sizeBytes: f.file.size,
              },
            });
          });
        });

        // PASO 2: Obtener pre-signed URLs
        const uploadPermissions = await campaignService.prepareAssetUploads({
          gameId,
          assets: assetsToUpload,
        });

        setUploadState({ status: 'uploading', progress: 0 });

        // PASO 3: Subir archivos a R2
        const uploadedAssets: Record<number, string> = {};
        let completedUploads = 0;
        const totalUploads = assetsToUpload.length;

        // Marcar todos como "uploading"
        setFiles((prev) => {
          const updated = new Map(prev);
          updated.forEach((fileList, defId) => {
            updated.set(
              defId,
              fileList.map((f) => ({ ...f, uploading: true, progress: 0 }))
            );
          });
          return updated;
        });

        for (const asset of assetsToUpload) {
          const permission = uploadPermissions[asset.assetDefinitionId];
          const fileList = files.get(asset.assetDefinitionId);
          const fileWithPreview = fileList?.find(
            (f) => f.file.name === asset.fileMetadata.originalFileName
          );

          if (!fileWithPreview || !permission) continue;

          try {
            setUploadState((prev) => ({
              ...prev,
              currentFile: fileWithPreview.file.name,
            }));

            // Upload con progress tracking
            await campaignService.uploadAssetToR2(
              permission.uploadUrl,
              fileWithPreview.file,
              fileWithPreview.file.type,
              (progress) => {
                setFiles((prev) =>
                  updateFileProgress(
                    prev,
                    asset.assetDefinitionId,
                    fileWithPreview.file.name,
                    { progress }
                  )
                );
              }
            );

            // Extraer objectKey
            const objectKey = new URL(permission.publicUrl).pathname.substring(1);
            uploadedAssets[asset.assetDefinitionId] = objectKey;

            // Marcar como uploaded
            setFiles((prev) =>
              updateFileProgress(
                prev,
                asset.assetDefinitionId,
                fileWithPreview.file.name,
                { uploading: false, uploaded: true, progress: 100, objectKey }
              )
            );

            completedUploads++;
            const overallProgress = (completedUploads / totalUploads) * 100;
            setUploadState((prev) => ({ ...prev, progress: overallProgress }));
          } catch (uploadError) {
            // Marcar este archivo con error
            setFiles((prev) =>
              updateFileProgress(
                prev,
                asset.assetDefinitionId,
                fileWithPreview.file.name,
                {
                  uploading: false,
                  error: 'Error subiendo archivo',
                  progress: 0,
                }
              )
            );
            throw new Error(`Error subiendo ${fileWithPreview.file.name}`);
          }
        }

        // PASO 4: Crear campaña
        setUploadState({ status: 'creating', progress: 100 });

        const campaign = await campaignService.createCampaign(
          gameId,
          advertiserId,
          uploadedAssets
        );

        setUploadState({ status: 'success', progress: 100 });

        if (onSuccess) {
          onSuccess(campaign.id);
        }

        return campaign;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error creando campaña';
        setUploadState({ status: 'error', progress: 0, error: errorMessage });

        if (onError) {
          onError(errorMessage);
        }

        throw error;
      }
    },
    [gameId, advertiserId, onSuccess, onError, updateFileProgress]
  );

  const resetUpload = useCallback(() => {
    setUploadState({ status: 'idle', progress: 0 });
  }, []);

  return {
    uploadState,
    uploadCampaign,
    resetUpload,
  };
}
// hooks/campaigns/useCampaignUpload.ts
import { useState, useCallback } from 'react';
import { campaignService } from '@/services/campaignService';
import { fileUploadService } from '@/services/FileUploadService';
import {
  FileWithPreview,
  CreateAssetRequest,
  UploadState,
  GameAssetDefinition,
  CampaignDetails,
} from '@/types/campaigns';

interface UseCampaignUploadProps {
  gameId: number;
  campaignDetails: CampaignDetails;
}

export function useCampaignUpload({
  gameId,
  campaignDetails,
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
    ): Promise<UploadCampaignResult> => {
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

        console.log('📤 [STEP 1] Preparando assets:', assetsToUpload);

        // PASO 2: Obtener pre-signed URLs y assetIds (sin detalles de campaña aún)
        const uploadPermissions = await campaignService.prepareAssetUploads({
          gameId,
          assets: assetsToUpload,
        });

        console.log('✅ [STEP 2] Permisos recibidos (array):', uploadPermissions);

        setUploadState({ status: 'uploading', progress: 0 });

        // PASO 3: Subir archivos a R2 y recolectar assetIds
        const uploadedAssetIds: number[] = [];
        let completedUploads = 0;
        const totalUploads = uploadPermissions.length;

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

        // Iterar sobre cada asset usando el array de permissions
        for (let i = 0; i < uploadPermissions.length; i++) {
          const { assetId, permission } = uploadPermissions[i];
          const assetRequest = assetsToUpload[i];

          const defId = assetRequest.assetDefinitionId;
          const fileList = files.get(defId);

          const fileWithPreview = fileList?.find(
            (f) => f.file.name === assetRequest.fileMetadata.originalFileName
          );

          if (!fileWithPreview) {
            console.error(`❌ Archivo no encontrado: ${assetRequest.fileMetadata.originalFileName}`);
            throw new Error(`Archivo no encontrado: ${assetRequest.fileMetadata.originalFileName}`);
          }

          try {
            setUploadState((prev) => ({
              ...prev,
              currentFile: fileWithPreview.file.name,
            }));

            console.log(`📤 [STEP 3] Subiendo: ${fileWithPreview.file.name}`);
            console.log(`📤 [STEP 3] AssetId: ${assetId}, URL: ${permission.uploadUrl}`);

            await fileUploadService.uploadToR2(
              permission.uploadUrl,
              fileWithPreview.file,
              (progress) => {
                setFiles((prev) =>
                  updateFileProgress(
                    prev,
                    defId,
                    fileWithPreview.file.name,
                    { progress }
                  )
                );
              }
            );

            console.log(`✅ [STEP 3] Subido exitosamente. AssetId: ${assetId}`);

            uploadedAssetIds.push(assetId);

            setFiles((prev) =>
              updateFileProgress(
                prev,
                defId,
                fileWithPreview.file.name,
                {
                  uploading: false,
                  uploaded: true,
                  progress: 100,
                  assetId,
                }
              )
            );

            completedUploads++;
            setUploadState((prev) => ({
              ...prev,
              progress: (completedUploads / totalUploads) * 100,
            }));

          } catch (e) {
            console.error(`❌ [STEP 3] Error subiendo ${fileWithPreview.file.name}:`, e);
            
            setFiles((prev) =>
              updateFileProgress(
                prev,
                defId,
                fileWithPreview.file.name,
                {
                  uploading: false,
                  error: 'Error subiendo archivo',
                  progress: 0,
                }
              )
            );
            throw e;
          }
        }

        console.log('✅ [STEP 3] Todos los archivos subidos. AssetIds:', uploadedAssetIds);

        // Verificar que tenemos assetIds
        if (uploadedAssetIds.length === 0) {
          throw new Error('No se pudieron obtener IDs de assets');
        }

        // PASO 4: Crear campaña con los IDs de assets y detalles
        setUploadState({ status: 'creating', progress: 100 });

        const success = await campaignService.createCampaign(
          gameId,
          uploadedAssetIds,
          campaignDetails
        );

        console.log('✅ [STEP 4] Campaña creada:', success);

        setUploadState({ status: 'success', progress: 100 });

        return { ok: true };

      } catch (error: any) {
        console.error('❌ Error en uploadCampaign:', error);

        const errorMsg = error?.message ?? 'Error inesperado al crear la campaña';
        setUploadState({ status: 'error', progress: 100, error: errorMsg });

        return { ok: false, errorMsg };
      }
    },
    [gameId, campaignDetails, updateFileProgress]
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

type UploadCampaignResult =
  | { ok: true; campaignId?: number }
  | { ok: false; errorMsg: string };
// hooks/ads/useAdUpload.ts
import { useState, useCallback } from 'react';
import { adService } from '@/services/adService';
import { fileUploadService } from '@/services/FileUploadService';
import {FileWithProgress, UploadState, AdDetails} from '@/types/ads/advertiser';

interface UseAdUploadProps {
  adDetails: AdDetails;
}

export function useAdUpload({ adDetails }: UseAdUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });

  const [fileState, setFileState] = useState<FileWithProgress | null>(null);

  const uploadAd = useCallback(
    async (file: File): Promise<UploadAdResult> => {
      try {
        // Inicializar el estado del archivo
        setFileState({
          file,
          uploading: false,
          uploaded: false,
          progress: 0,
        });

        setUploadState({ status: 'preparing', progress: 0 });

        // PASO 1: Preparar asset request
        const assetRequest = {
            originalFileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
        };

        console.log('📤 [STEP 1] Preparando asset:', assetRequest);

        // PASO 2: Obtener pre-signed URL y assetId
        const uploadPermission = await adService.prepareAdAssetUpload(assetRequest);

        console.log('✅ [STEP 2] Permiso recibido:', uploadPermission);

        const { assetId, permission } = uploadPermission;

        setUploadState({ status: 'uploading', progress: 0, currentFile: file.name });

        // Marcar como "uploading"
        setFileState((prev) =>
          prev ? { ...prev, uploading: true, progress: 0 } : null
        );

        // PASO 3: Subir archivo a R2
        try {
          console.log(`📤 [STEP 3] Subiendo: ${file.name}`);
          console.log(`📤 [STEP 3] AssetId: ${assetId}, URL: ${permission.uploadUrl}`);

          await fileUploadService.uploadToR2(
            permission.uploadUrl,
            file,
            (progress) => {
              setFileState((prev) =>
                prev ? { ...prev, progress } : null
              );
              setUploadState((prev) => ({
                ...prev,
                progress: progress * 0.9, // 90% del progreso es la subida
              }));
            }
          );

          console.log(`✅ [STEP 3] Subido exitosamente. AssetId: ${assetId}`);

          setFileState((prev) =>
            prev
              ? {
                  ...prev,
                  uploading: false,
                  uploaded: true,
                  progress: 100,
                  assetId,
                }
              : null
          );

        } catch (e) {
          console.error(`❌ [STEP 3] Error subiendo ${file.name}:`, e);

          setFileState((prev) =>
            prev
              ? {
                  ...prev,
                  uploading: false,
                  error: 'Error subiendo archivo',
                  progress: 0,
                }
              : null
          );

          throw new Error('Error subiendo el archivo a R2');
        }

        // PASO 4: Crear anuncio con el ID del asset y los detalles
        setUploadState({ status: 'creating', progress: 90 });

        const result = await adService.createAd(assetId, adDetails);

        console.log('✅ [STEP 4] Anuncio creado:', result);

        setUploadState({ status: 'success', progress: 100 });

        return { ok: true, adId: result.id };

      } catch (error: any) {
        console.error('❌ Error en uploadAd:', error);

        const errorMsg =
          error?.message ?? 'Error inesperado al crear el anuncio';
        setUploadState({ status: 'error', progress: 0, error: errorMsg });

        return { ok: false, errorMsg };
      }
    },
    [adDetails]
  );

  const resetUpload = useCallback(() => {
    setUploadState({ status: 'idle', progress: 0 });
    setFileState(null);
  }, []);

  return {
    uploadState,
    fileState,
    uploadAd,
    resetUpload,
  };
}

type UploadAdResult =
  | { ok: true; adId: number }
  | { ok: false; errorMsg: string };
import { useState, useCallback } from 'react';
import {
  prepareProductImageUpdate,
  confirmProductImageUpdate,
} from '@/services/ProductService';
import { fileUploadService } from '@/services/FileUploadService';

// ============================================================
// TIPOS
// ============================================================

export type ImageUpdateStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'confirming'
  | 'success'
  | 'error';

export interface ImageUpdateState {
  status: ImageUpdateStatus;
  progress: number;
  error?: string;
}

export type ImageUpdateResult =
  | { ok: true }
  | { ok: false; errorMsg: string };

// ============================================================
// HOOK
// ============================================================

export function useProductImageUpdate() {
  const [state, setState] = useState<ImageUpdateState>({
    status: 'idle',
    progress: 0,
  });

  const updateImage = useCallback(
    async (productId: number, image: File): Promise<ImageUpdateResult> => {
      try {
        // ── PASO 1: Pedir URL prefirmada ─────────────────────────────
        setState({ status: 'preparing', progress: 0 });

        console.log('📋 [PASO 1] Preparando actualización de imagen...');

        const { productAssetId, productImagePermission } =
          await prepareProductImageUpdate(productId, {
            originalFileName: image.name,
            contentType: image.type,
            sizeBytes: image.size,
          });

        console.log('✅ [PASO 1] Permiso recibido. AssetId:', productAssetId);

        // ── PASO 2: Subir imagen a R2 ────────────────────────────────
        setState({ status: 'uploading', progress: 0 });

        console.log('📤 [PASO 2] Subiendo imagen a R2...');

        await fileUploadService.uploadToR2(
          productImagePermission.uploadUrl,
          image,
          (progress) => {
            setState({ status: 'uploading', progress: progress * 0.9 });
          }
        );

        console.log('✅ [PASO 2] Imagen subida exitosamente.');

        // ── PASO 3: Confirmar en el backend ──────────────────────────
        setState({ status: 'confirming', progress: 90 });

        console.log('📋 [PASO 3] Confirmando actualización...');

        await confirmProductImageUpdate(productId, { newAssetId: productAssetId });

        console.log('✅ [PASO 3] Imagen actualizada correctamente.');

        setState({ status: 'success', progress: 100 });

        return { ok: true };

      } catch (error: any) {
        console.error('❌ Error actualizando imagen:', error);

        const errorMsg =
          error?.response?.data?.message ??
          error?.message ??
          'Error inesperado al actualizar la imagen';

        setState({ status: 'error', progress: 0, error: errorMsg });

        return { ok: false, errorMsg };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0 });
  }, []);

  return { state, updateImage, reset };
}
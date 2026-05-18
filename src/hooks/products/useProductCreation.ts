import { useState, useCallback } from 'react';
import { prepareProductCreation, confirmProductCreation } from '@/services/ProductService';
import { fileUploadService } from '@/services/FileUploadService';
import { CreateProductRequestDTO } from '@/types/products/Product.types';

// ============================================================
// TIPOS
// ============================================================

export type ProductCreationStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'creating'
  | 'success'
  | 'error';

export interface ProductCreationState {
  status: ProductCreationStatus;
  progress: number;
  error?: string;
  createdProductId?: number;
}

export type ProductCreationResult =
  | { ok: true; productId: number }
  | { ok: false; errorMsg: string };

// ============================================================
// HOOK
// ============================================================

export function useProductCreation() {
  const [state, setState] = useState<ProductCreationState>({
    status: 'idle',
    progress: 0,
  });

  const createProduct = useCallback(
    async (
      image: File,
      productData: CreateProductRequestDTO
    ): Promise<ProductCreationResult> => {
      try {
        // ── PASO 1: Pedir URL prefirmada al backend ──────────────────
        setState({ status: 'preparing', progress: 0 });

        const assetRequest = {
          originalFileName: image.name,
          contentType: image.type,
          sizeBytes: image.size,
        };

        console.log('📋 [PASO 1] Preparando creación de producto:', assetRequest);

        const {assetId, imagePermission } =
          await prepareProductCreation(assetRequest);

        console.log('✅ [PASO 1] Permiso recibido. AssetId:', assetId);

        // ── PASO 2: Subir imagen directamente a R2 ───────────────────
        setState({ status: 'uploading', progress: 0 });

        console.log('📤 [PASO 2] Subiendo imagen a R2...');

        await fileUploadService.uploadToR2(
          imagePermission.uploadUrl,
          image,
          (progress) => {
            setState({ status: 'uploading', progress: progress * 0.9 }); // 90% del progreso total
          }
        );

        console.log('✅ [PASO 2] Imagen subida exitosamente.');

        // ── PASO 3: Confirmar creación del producto en el backend ─────
        setState({ status: 'creating', progress: 90 });

        console.log('📋 [PASO 3] Confirmando creación del producto...');

        const result = await confirmProductCreation({
          productAssetId: assetId,
          productData,
        });

        console.log('✅ [PASO 3] Producto creado. ID:', result.id);

        setState({ status: 'success', progress: 100, createdProductId: result.id });

        return { ok: true, productId: result.id };

      } catch (error: any) {
        console.error('❌ Error en createProduct:', error);

        const errorMsg = error?.response?.data?.message
          ?? error?.message
          ?? 'Error inesperado al crear el producto';

        setState({ status: 'error', progress: 0, error: errorMsg });

        return { ok: false, errorMsg };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0 });
  }, []);

  return { state, createProduct, reset };
}
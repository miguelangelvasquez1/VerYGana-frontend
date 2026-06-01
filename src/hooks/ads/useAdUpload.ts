// hooks/ads/useAdUpload.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { adService } from '@/services/adService';
import { fileUploadService } from '@/services/FileUploadService';
import {
  FileWithProgress,
  UploadState,
  AdDetails,
  AssetPricingInfo,
  FileUploadRequestDTO,
} from '@/types/ads/commercial';

interface UseAdUploadProps {
  adDetails: AdDetails;
}

type UploadAdResult =
  | { ok: true; adId: number }
  | { ok: false; errorMsg: string };

type PrepareAndUploadResult =
  | { ok: true; pricing: AssetPricingInfo }
  | { ok: false; errorMsg: string };

/**
 * Manages the full ad upload flow:
 *
 * prepareAndUpload(file, imageDurationSeconds?)
 *   → STEP 1: POST /ads/assets/prepare         (create record + get R2 URL)
 *   → STEP 2: PUT to R2                        (upload file)
 *   → STEP 3: POST /ads/assets/{id}/analyze    (resolve duration + pricing)
 *   → returns AssetPricingInfo for the form to display
 *
 * uploadAd()
 *   → STEP 4: POST /ads                        (create ad with pricePerView + maxViews)
 *
 * Orphan logic (asset marked ORPHANED in DB → cleanup job removes from R2):
 *   - User changes file  → orphanCurrentAsset() before new prepareAndUpload
 *   - User cancels form  → cancelAndOrphan()
 *   - Page unload        → sendBeacon (beforeunload + unmount)
 *   - analyze fails      → backend already orphans; hook resets state
 *   - createAd fails     → backend already orphans; hook returns error
 */
export function useAdUpload({ adDetails }: UseAdUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [fileState, setFileState] = useState<FileWithProgress | null>(null);
  const [pricingInfo, setPricingInfo] = useState<AssetPricingInfo | null>(null);

  // Always-fresh ref to the current assetId for use in effects/cleanup
  const currentAssetIdRef = useRef<number | null>(null);
  // Flipped to true only when createAd succeeds — prevents cleanup from orphaning a committed asset
  const committedRef = useRef(false);

  // ── Orphan helpers ─────────────────────────────────────────────────────────

  const orphanCurrentAsset = useCallback(async () => {
    const id = currentAssetIdRef.current;
    if (id == null || committedRef.current) return;
    currentAssetIdRef.current = null;
    try {
      await adService.orphanAsset(id);
      console.log(`[useAdUpload] Asset ${id} orphaned`);
    } catch (err) {
      // Non-fatal: backend job will clean up eventually
      console.warn(`[useAdUpload] Failed to orphan asset ${id}:`, err);
    }
  }, []);

  // Register beforeunload beacon once — always sends if there's a pending asset
  useEffect(() => {
    const handleUnload = () => {
      const id = currentAssetIdRef.current;
      if (id != null && !committedRef.current) {
        adService.orphanAssetBeacon(id);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Orphan via beacon on component unmount (e.g. user navigates away)
  useEffect(() => {
    return () => {
      const id = currentAssetIdRef.current;
      if (id != null && !committedRef.current) {
        adService.orphanAssetBeacon(id);
      }
    };
  }, []);

  // ── Step 1+2+3: Prepare → Upload → Analyze ────────────────────────────────

  /**
   * Full upload + analyze flow.
   *
   * @param file                - The file to upload
   * @param imageDurationSeconds - Required for image/* files (5–60 s), omit for video/*
   */
  const prepareAndUpload = useCallback(
    async (file: File, imageDurationSeconds?: number): Promise<PrepareAndUploadResult> => {
      // Orphan any previous pending asset before starting fresh
      await orphanCurrentAsset();
      committedRef.current = false;
      setPricingInfo(null);

      setFileState({ file, uploading: false, uploaded: false, progress: 0 });

      try {
        // ── STEP 1: Prepare ────────────────────────────────────────────────
        setUploadState({ status: 'preparing', progress: 0 });

        const prepareRequest: FileUploadRequestDTO = {
          originalFileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          ...(imageDurationSeconds != null && { imageDurationSeconds }),
        };

        console.log('[useAdUpload] STEP 1 — prepare:', prepareRequest);
        const { assetId, permission } = await adService.prepareAdAssetUpload(prepareRequest);
        console.log('[useAdUpload] STEP 1 — done. assetId:', assetId);

        currentAssetIdRef.current = assetId;

        // ── STEP 2: Upload to R2 ───────────────────────────────────────────
        setUploadState({ status: 'uploading', progress: 0, currentFile: file.name });
        setFileState((prev) => (prev ? { ...prev, uploading: true, progress: 0 } : null));

        console.log(`[useAdUpload] STEP 2 — uploading ${file.name}`);
        await fileUploadService.uploadToR2(permission.uploadUrl, file, (progress) => {
          setFileState((prev) => (prev ? { ...prev, progress } : null));
          // Upload accounts for 80% of visual progress; analyze is the remaining 20%
          setUploadState((prev) => ({ ...prev, progress: progress * 0.8 }));
        });
        console.log('[useAdUpload] STEP 2 — upload complete');

        setFileState((prev) => (prev ? { ...prev, uploading: false, uploaded: true, progress: 100, assetId } : null));

        // ── STEP 3: Analyze (get real duration + pricing) ──────────────────
        setUploadState({ status: 'analyzing', progress: 80, currentFile: file.name });
        console.log('[useAdUpload] STEP 3 — analyzing asset', assetId);

        const analysis = await adService.analyzeAsset(assetId);
        console.log('[useAdUpload] STEP 3 — analysis result:', analysis);

        setUploadState({ status: 'idle', progress: 100 });

        const pricing: AssetPricingInfo = {
          assetId,
          durationSeconds: analysis.durationSeconds,
          minPricePerLike: analysis.minPricePerLike,
        };

        setPricingInfo(pricing);
        return { ok: true, pricing };

      } catch (error: any) {
        const errorMsg = error?.response?.data?.message ?? error?.message ?? 'Error subiendo el archivo';
        console.error('[useAdUpload] prepareAndUpload error:', errorMsg);

        setFileState((prev) => (prev ? { ...prev, uploading: false, error: errorMsg, progress: 0 } : null));
        setUploadState({ status: 'error', progress: 0, error: errorMsg });

        // If analyze failed, backend already orphaned the asset.
        // If prepare or upload failed, we need to orphan ourselves.
        await orphanCurrentAsset();

        return { ok: false, errorMsg };
      }
    },
    [orphanCurrentAsset]
  );

  // ── Step 4: Create ad ──────────────────────────────────────────────────────

  /**
   * Creates the Ad entity using the VALIDATED asset.
   * adDetails must include pricePerView and maxViews at this point.
   */
  const uploadAd = useCallback(async (): Promise<UploadAdResult> => {
    const assetId = currentAssetIdRef.current;
    if (assetId == null) {
      return { ok: false, errorMsg: 'No hay archivo analizado. Sube un archivo primero.' };
    }

    try {
      setUploadState({ status: 'creating', progress: 90 });
      console.log('[useAdUpload] STEP 4 — creating ad with assetId:', assetId);

      const result = await adService.createAd(assetId, adDetails);
      console.log('[useAdUpload] STEP 4 — ad created:', result);

      // Commit: prevent any cleanup from orphaning this asset
      committedRef.current = true;
      currentAssetIdRef.current = null;
      setUploadState({ status: 'success', progress: 100 });

      return { ok: true, adId: result.id };

    } catch (error: any) {
      const errorMsg = error?.response?.data?.message ?? error?.message ?? 'Error creando el anuncio';
      console.error('[useAdUpload] STEP 4 error:', errorMsg);

      setUploadState({ status: 'error', progress: 0, error: errorMsg });
      // Backend already orphaned in catch block — reset our ref too
      currentAssetIdRef.current = null;

      return { ok: false, errorMsg };
    }
  }, [adDetails]);

  // ── Cancel ─────────────────────────────────────────────────────────────────

  /** Cancels the current upload/analysis and marks the asset as orphaned. */
  const cancelAndOrphan = useCallback(async () => {
    await orphanCurrentAsset();
    setUploadState({ status: 'idle', progress: 0 });
    setFileState(null);
    setPricingInfo(null);
    committedRef.current = false;
  }, [orphanCurrentAsset]);

  const resetUpload = useCallback(() => {
    setUploadState({ status: 'idle', progress: 0 });
    setFileState(null);
    setPricingInfo(null);
  }, []);

  return {
    uploadState,
    fileState,
    pricingInfo,
    prepareAndUpload,
    uploadAd,
    cancelAndOrphan,
    resetUpload,
  };
}
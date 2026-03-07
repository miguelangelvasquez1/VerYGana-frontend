import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { impactStoryApi, impactStoryKeys } from '@/services/imapactStoryService';
import { fileUploadService } from '@/services/FileUploadService';
import type {
  CreateImpactStoryRequest,
  ImpactStoryFilters,
  ImpactStoryFormValues,
  MediaFilePreview,
  StoryStatus,
  UpdateImpactStoryRequest,
} from '@/types/impactStory.types';

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useImpactStoriesForConsumer(filters: ImpactStoryFilters = {}) {
  return useQuery({
    queryKey: impactStoryKeys.list(filters),
    queryFn: () => impactStoryApi.getImpactStoriesForConsumer(filters),
    staleTime: 1000 * 60 * 2, 
  });
}

export function useImpactStories(filters: ImpactStoryFilters = {}) {
  return useQuery({
    queryKey: impactStoryKeys.list(filters),
    queryFn: () => impactStoryApi.getImpactStories(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useImpactStory(id: number) {
  return useQuery({
    queryKey: impactStoryKeys.detail(id),
    queryFn: () => impactStoryApi.getImpactStoryById(id),
    enabled: !!id,
  });
}

export function useUpdateImpactStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateImpactStoryRequest) =>
      impactStoryApi.updateImpactStory(request),
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: impactStoryKeys.lists() });
      queryClient.setQueryData(impactStoryKeys.detail(data.id), data);
    },
  });
}

export function useDeleteImpactStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => impactStoryApi.deleteImpactStory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: impactStoryKeys.lists() });
      queryClient.removeQueries({ queryKey: impactStoryKeys.detail(id) });
    },
  });
}

// ─── Upload state ─────────────────────────────────────────────────────────────

export type SubmitStatus =
  | 'idle'
  | 'uploading_media'   // subiendo archivos al CDN
  | 'creating'          // llamando POST /impact-stories
  | 'success'
  | 'error';

export interface ImpactStorySubmitState {
  status: SubmitStatus;
  /** Progreso global 0–100 */
  progress: number;
  error?: string;
}

// ─── useImpactStoryUpload ─────────────────────────────────────────────────────

/**
 * Encapsula el flujo completo de 3 pasos:
 *   1. prepareMediaAssetUpload  → obtiene (mediaAssetId, uploadUrl, publicUrl)
 *   2. fileUploadService.uploadToR2  → sube los bytes directamente al CDN
 *   3. impactStoryApi.createImpactStory  → crea la historia con los assetIds
 *
 * Actualiza el estado de cada MediaFilePreview en tiempo real vía setMedia.
 */
export function useImpactStoryUpload() {
  const queryClient = useQueryClient();
  const [submitState, setSubmitState] = useState<ImpactStorySubmitState>({
    status: 'idle',
    progress: 0,
  });

  const submit = useCallback(
    async (
      values: ImpactStoryFormValues,
      statusOverride: StoryStatus,
      setMedia: React.Dispatch<React.SetStateAction<MediaFilePreview[]>>
    ): Promise<{ ok: true; storyId: number } | { ok: false; error: string }> => {
      try {
        const pendingFiles = values.mediaFiles.filter(
          (m) => m.uploadStatus !== 'done'
        );
        const alreadyDone = values.mediaFiles.filter(
          (m) => m.uploadStatus === 'done'
        );

        // ── PASO 1 + 2: Subir archivos pendientes ─────────────────────────────
        if (pendingFiles.length > 0) {
          setSubmitState({ status: 'uploading_media', progress: 0 });

          const totalFiles = pendingFiles.length;
          let completedFiles = 0;

          const uploadResults = await Promise.all(
            pendingFiles.map(async (media) => {
              if (!media.file) {
                throw new Error(`Archivo faltante para media: ${media.fileName}`);
              }

              // Marcar como "preparing"
              setMedia((prev) =>
                prev.map((m) =>
                  m.id === media.id
                    ? { ...m, uploadStatus: 'preparing', uploadProgress: 0 }
                    : m
                )
              );

              console.log(`📤 [STEP 1] Preparando asset: ${media.fileName}`);

              // PASO 1: Obtener pre-signed URL
              const permission = await impactStoryApi.prepareMediaAssetUpload({
                originalFileName: media.fileName,
                contentType: media.mimeType,
                sizeBytes: media.fileSize,
              });

              console.log(`✅ [STEP 1] Permiso recibido para ${media.fileName}:`, permission);

              // Marcar como "uploading"
              setMedia((prev) =>
                prev.map((m) =>
                  m.id === media.id
                    ? { ...m, uploadStatus: 'uploading', uploadProgress: 0 }
                    : m
                )
              );

              // PASO 2: Subir a R2
              try {
                console.log(`📤 [STEP 2] Subiendo a R2: ${media.fileName}`);

                await fileUploadService.uploadToR2(
                  permission.permission.uploadUrl,
                  media.file,
                  (progress) => {
                    setMedia((prev) =>
                      prev.map((m) =>
                        m.id === media.id
                          ? { ...m, uploadProgress: progress }
                          : m
                      )
                    );

                    // Progreso global basado en archivos completados + progreso actual
                    const globalProgress =
                      ((completedFiles + progress / 100) / totalFiles) * 80; // 80% del total
                    setSubmitState((prev) => ({
                      ...prev,
                      progress: Math.round(globalProgress),
                    }));
                  }
                );

                console.log(`✅ [STEP 2] Subido exitosamente: ${media.fileName}`);
                completedFiles++;

                // Marcar como "done"
                setMedia((prev) =>
                  prev.map((m) =>
                    m.id === media.id
                      ? {
                          ...m,
                          uploadStatus: 'done',
                          uploadProgress: 100,
                          mediaAssetId: permission.mediaAssetId,
                          publicUrl: permission.permission.publicUrl,
                        }
                      : m
                  )
                );

                return {
                  localId: media.id,
                  mediaAssetId: permission.mediaAssetId,
                  publicUrl: permission.permission.publicUrl,
                };
              } catch (e) {
                console.error(`❌ [STEP 2] Error subiendo ${media.fileName}:`, e);

                setMedia((prev) =>
                  prev.map((m) =>
                    m.id === media.id
                      ? {
                          ...m,
                          uploadStatus: 'error',
                          uploadProgress: 0,
                          uploadError: 'Error al subir el archivo',
                        }
                      : m
                  )
                );
                throw new Error(`Error subiendo el archivo "${media.fileName}" al CDN`);
              }
            })
          );

          // Construir mapa localId → mediaAssetId para los recién subidos
          const uploadMap = new Map(
            uploadResults.map((r) => [r.localId, r.mediaAssetId])
          );

          // ── PASO 3: Crear historia ────────────────────────────────────────
          setSubmitState({ status: 'creating', progress: 85 });

          const mediaPayload = values.mediaFiles.map((m) => {
            const assetId =
              m.uploadStatus === 'done' && m.mediaAssetId
                ? m.mediaAssetId
                : uploadMap.get(m.id);

            if (!assetId) {
              throw new Error(`No se pudo resolver mediaAssetId para: ${m.fileName}`);
            }

            return {
              mediaAssetId: assetId,
              mediaType: m.mediaType,
              fileName: m.fileName,
              fileSize: m.fileSize,
              mimeType: m.mimeType,
              altText: m.altText || undefined,
              displayOrder: m.displayOrder,
              isCover: m.isCover,
            };
          });

          const payload: CreateImpactStoryRequest = {
            title: values.title,
            description: values.description,
            storyDate: values.storyDate,
            beneficiariesCount: Number(values.beneficiariesCount),
            investedAmount: Number(values.investedAmount) || 0,
            investedCurrency: values.investedCurrency,
            location: values.location || undefined,
            category: values.category || undefined,
            status: statusOverride,
            authorName: values.authorName || undefined,
            tags: values.tags || undefined,
            mediaFiles: mediaPayload,
          };

          console.log('📤 [STEP 3] Creando historia:', payload);
          const story = await impactStoryApi.createImpactStory(payload);
          console.log('✅ [STEP 3] Historia creada:', story);

          queryClient.invalidateQueries({ queryKey: impactStoryKeys.lists() });
          setSubmitState({ status: 'success', progress: 100 });
          return { ok: true, storyId: story.id };

        } else {
          // No hay archivos nuevos (solo archivos ya subidos anteriormente)
          setSubmitState({ status: 'creating', progress: 50 });

          const mediaPayload = alreadyDone.map((m) => ({
            mediaAssetId: m.mediaAssetId!,
            mediaType: m.mediaType,
            fileName: m.fileName,
            fileSize: m.fileSize,
            mimeType: m.mimeType,
            altText: m.altText || undefined,
            displayOrder: m.displayOrder,
            isCover: m.isCover,
          }));

          const payload: CreateImpactStoryRequest = {
            title: values.title,
            description: values.description,
            storyDate: values.storyDate,
            beneficiariesCount: Number(values.beneficiariesCount),
            investedAmount: Number(values.investedAmount) || 0,
            investedCurrency: values.investedCurrency,
            location: values.location || undefined,
            category: values.category || undefined,
            status: statusOverride,
            authorName: values.authorName || undefined,
            tags: values.tags || undefined,
            mediaFiles: mediaPayload,
          };

          const story = await impactStoryApi.createImpactStory(payload);
          queryClient.invalidateQueries({ queryKey: impactStoryKeys.lists() });
          setSubmitState({ status: 'success', progress: 100 });
          return { ok: true, storyId: story.id };
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Error inesperado';
        console.error('❌ Error en submit de historia:', error);
        setSubmitState({ status: 'error', progress: 0, error: message });
        return { ok: false, error: message };
      }
    },
    [queryClient]
  );

  const resetSubmit = useCallback(() => {
    setSubmitState({ status: 'idle', progress: 0 });
  }, []);

  return { submitState, submit, resetSubmit };
}
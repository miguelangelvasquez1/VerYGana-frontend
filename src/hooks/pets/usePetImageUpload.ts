import { useCallback, useRef, useState } from 'react';
import {
  requestPetImageUpload,
  type PetImageUploadPermission,
} from '@/services/PetRequestService';
import { fileUploadService } from '@/services/FileUploadService';

// ── Reglas del archivo ────────────────────────────────────────────────────────

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

/**
 * Los 400 del backend vienen como { status, error, message, timestamp, path }
 * con el `message` ya redactado en español: se muestra tal cual.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response?.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  const raw = (err as { message?: unknown })?.message;
  return typeof raw === 'string' && raw ? raw : fallback;
}

/** Validación en cliente — evita gastar un permiso en un archivo que el backend va a rechazar. */
function validate(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Formato no admitido. Usa PNG, JPEG o WEBP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'La imagen pesa más de 5 MB. Usa una versión más liviana.';
  }
  return null;
}

// ── Estado ────────────────────────────────────────────────────────────────────

export type PetImageStatus = 'idle' | 'preparing' | 'uploading' | 'ready' | 'error';

export interface PetImageState {
  status: PetImageStatus;
  progress: number;
  error: string;
  /** Lo que se manda en `imageObjectKey`; `null` mientras no haya imagen subida. */
  objectKey: string | null;
  previewUrl: string | null;
  fileName: string;
}

const EMPTY: PetImageState = {
  status: 'idle',
  progress: 0,
  error: '',
  objectKey: null,
  previewUrl: null,
  fileName: '',
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Sube la imagen apenas se elige el archivo: pide el permiso (paso 1) y hace el
 * PUT directo a R2 (paso 2). Cuando termina deja el `objectKey` listo para que
 * el formulario lo mande en el POST de la solicitud (paso 3).
 *
 * El PUT no pasa por nuestra API — va al bucket con la URL firmada, sin
 * `Authorization` y con el File crudo, porque cualquier header extra o un
 * FormData invalidan la firma.
 */
export function usePetImageUpload() {
  const [state, setState] = useState<PetImageState>(EMPTY);
  const previewRef = useRef<string | null>(null);
  // Guardamos el archivo para poder reintentar sin obligar a elegirlo de nuevo:
  // un fallo de red o una firma vencida no son culpa de quien lo seleccionó.
  const fileRef = useRef<File | null>(null);

  const releasePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    releasePreview();
    fileRef.current = null;
    setState(EMPTY);
  }, [releasePreview]);

  const select = useCallback(
    async (file: File) => {
      const invalid = validate(file);
      if (invalid) {
        releasePreview();
        fileRef.current = null;
        setState({ ...EMPTY, status: 'error', error: invalid, fileName: file.name });
        return;
      }

      releasePreview();
      fileRef.current = file;
      const preview = URL.createObjectURL(file);
      previewRef.current = preview;

      setState({
        status: 'preparing',
        progress: 0,
        error: '',
        objectKey: null,
        previewUrl: preview,
        fileName: file.name,
      });

      try {
        const permission: PetImageUploadPermission = await requestPetImageUpload({
          contentType: file.type,
          originalFileName: file.name,
          sizeBytes: file.size,
        });

        setState((s) => ({ ...s, status: 'uploading', progress: 0 }));

        await fileUploadService.uploadToR2(permission.uploadUrl, file, (progress) =>
          setState((s) => (s.status === 'uploading' ? { ...s, progress } : s)),
        );

        setState((s) => ({
          ...s,
          status: 'ready',
          progress: 100,
          objectKey: permission.objectKey,
        }));
      } catch (err: unknown) {
        // El backend manda { message } en español; el PUT a R2 no pasa por la
        // API, así que ahí un fallo de red suele ser CORS o la firma vencida.
        const message =
          (err as { message?: string })?.message === 'Network error during upload'
            ? 'No se pudo subir la imagen al almacenamiento. Reintenta en un momento.'
            : apiErrorMessage(err, 'No se pudo subir la imagen.');

        setState((s) => ({ ...s, status: 'error', progress: 0, error: message, objectKey: null }));
      }
    },
    [releasePreview],
  );

  /** Reintenta con el mismo archivo — pide un permiso nuevo, la firma anterior ya no sirve. */
  const retry = useCallback(() => {
    if (fileRef.current) select(fileRef.current);
  }, [select]);

  return {
    state,
    select,
    clear,
    retry,
    canRetry: state.status === 'error' && fileRef.current !== null,
    busy: state.status === 'preparing' || state.status === 'uploading',
  };
}

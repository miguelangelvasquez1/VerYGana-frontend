import { useCallback, useRef, useState } from 'react';
import {
  prepareDesignerAsset,
  type DesignerAssetKind,
} from '@/services/PetRequestService';
import { apiErrorMessage } from './usePetImageUpload';

/**
 * Subida de assets del diseñador. Deliberadamente separado de
 * `usePetImageUpload`, que es del comercial: aquel acepta 5 MB y solo imágenes,
 * y tocarle las constantes rompería un flujo que ya funciona.
 *
 * Los límites de acá son los del diseñador: 25 MB, y además de imágenes,
 * vídeo (mp4/mov) para los objetos de escena de tipo `video`.
 */

export const SCENE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const SCENE_VIDEO_TYPES = ['video/mp4', 'video/quicktime'] as const;

export const MAX_SCENE_ASSET_BYTES = 25 * 1024 * 1024;

/** `.mov` llega como `video/quicktime`; se acepta la extensión en el `accept`. */
export const SCENE_ASSET_ACCEPT = [...SCENE_IMAGE_TYPES, ...SCENE_VIDEO_TYPES, '.mov'].join(',');
export const CATALOG_SPRITE_ACCEPT = SCENE_IMAGE_TYPES.join(',');

function allowedTypes(kind: DesignerAssetKind): readonly string[] {
  return kind === 'SCENE_OBJECT'
    ? [...SCENE_IMAGE_TYPES, ...SCENE_VIDEO_TYPES]
    : SCENE_IMAGE_TYPES;
}

function validate(file: File, kind: DesignerAssetKind): string | null {
  if (!allowedTypes(kind).includes(file.type)) {
    return kind === 'SCENE_OBJECT'
      ? 'Formato no admitido. Usa PNG, JPEG, WEBP, MP4 o MOV.'
      : 'Formato no admitido. Usa PNG, JPEG o WEBP.';
  }
  if (file.size > MAX_SCENE_ASSET_BYTES) {
    return 'El archivo pesa más de 25 MB.';
  }
  return null;
}

export type SceneAssetStatus = 'idle' | 'preparing' | 'uploading' | 'ready' | 'error';

export interface SceneAssetState {
  status: SceneAssetStatus;
  progress: number;
  error: string;
  objectKey: string | null;
  fileName: string;
}

const EMPTY: SceneAssetState = {
  status: 'idle',
  progress: 0,
  error: '',
  objectKey: null,
  fileName: '',
};

/**
 * PUT crudo a R2. Sin `apiClient` a propósito: su interceptor añade
 * `Authorization`, y ese header invalida la firma prefirmada (403). El
 * `Content-Type` tiene que ser exactamente el declarado en el paso 1 porque
 * también forma parte de lo firmado. Tampoco puede ir como FormData.
 */
function putToR2(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    });
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 respondió ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
}

export function usePetSceneAssetUpload(kind: DesignerAssetKind = 'SCENE_OBJECT') {
  const [state, setState] = useState<SceneAssetState>(EMPTY);
  const fileRef = useRef<File | null>(null);

  const reset = useCallback(() => {
    fileRef.current = null;
    setState(EMPTY);
  }, []);

  const select = useCallback(
    async (file: File): Promise<string | null> => {
      const invalid = validate(file, kind);
      if (invalid) {
        fileRef.current = null;
        setState({ ...EMPTY, status: 'error', error: invalid, fileName: file.name });
        return null;
      }

      fileRef.current = file;
      setState({ ...EMPTY, status: 'preparing', fileName: file.name });

      try {
        const permission = await prepareDesignerAsset({
          kind,
          contentType: file.type,
          originalFileName: file.name,
          sizeBytes: file.size,
        });

        setState(s => ({ ...s, status: 'uploading', progress: 0 }));

        await putToR2(permission.uploadUrl, file, file.type, pct =>
          setState(s => (s.status === 'uploading' ? { ...s, progress: pct } : s)),
        );

        setState(s => ({ ...s, status: 'ready', progress: 100, objectKey: permission.objectKey }));
        return permission.objectKey;
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message === 'Network error during upload'
            ? 'No se pudo subir el archivo al almacenamiento. Reintenta en un momento.'
            : apiErrorMessage(err, 'No se pudo subir el archivo.');
        setState(s => ({ ...s, status: 'error', progress: 0, error: message, objectKey: null }));
        return null;
      }
    },
    [kind],
  );

  const retry = useCallback(() => {
    if (fileRef.current) return select(fileRef.current);
    return Promise.resolve(null);
  }, [select]);

  return {
    state,
    select,
    retry,
    reset,
    canRetry: state.status === 'error' && fileRef.current !== null,
    busy: state.status === 'preparing' || state.status === 'uploading',
  };
}

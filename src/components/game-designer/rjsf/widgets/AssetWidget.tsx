// components/widgets/AssetWidget.tsx
import React, { useRef, useState, useCallback } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image, Music, File } from 'lucide-react';
import { uploadAsset } from '@/services/games-campaigns/assetService2';

// The stored form value for an asset field.
// Going forward: { assetId, url }. Legacy drafts may still be a plain URL string.
export interface AssetFieldValue {
  assetId: number;
  url: string;
}

function getPreviewUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'url' in (value as object))
    return (value as AssetFieldValue).url;
  return null;
}

function getPreviousAssetId(value: unknown): number | undefined {
  if (typeof value === 'object' && value !== null && 'assetId' in (value as object))
    return (value as AssetFieldValue).assetId;
  return undefined;
}

export const AssetWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, readonly, disabled, options, registry } = props;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previewUrl = getPreviewUrl(value);
  const assetType = (options?.assetType as string) || 'image';
  const accept = getAcceptString(assetType);

  // In RJSF v5+, formContext lives in registry.formContext, not as a direct prop
  const brandingRequestId: number | undefined = (registry?.formContext as any)?.brandingRequestId;
  // Ref so the callback always reads the latest value without stale-closure issues
  const valueRef = useRef<unknown>(value);
  valueRef.current = value;

  const handleDeleteConfirmed = useCallback(async () => {
    const assetId = getPreviousAssetId(valueRef.current);
    setDeleting(true);
    setError(null);
    try {
      if (assetId) await uploadAsset.deleteAsset(assetId);
      onChange(undefined);
      setConfirmDelete(false);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el asset');
    } finally {
      setDeleting(false);
    }
  }, [onChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!brandingRequestId) {
      setError('brandingRequestId no disponible — no se puede subir el archivo.');
      return;
    }

    const previousAssetId = getPreviousAssetId(valueRef.current);

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const uploadData = await uploadAsset.requestUploadUrl({
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        brandingRequestId,
      });

      await uploadToR2(file, uploadData.permission.uploadUrl, (pct) => setProgress(pct));

      await uploadAsset.confirmUpload({
        assetId: uploadData.assetId,
        previousAssetId,
      });

      onChange({ assetId: uploadData.assetId, url: uploadData.publicUrl });

    } catch (err: any) {
      console.error('Asset upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  }, [onChange, brandingRequestId]);

  const getIcon = () => {
    switch (assetType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      default:      return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full">
      {previewUrl && !uploading && (
        <div className="mb-2">
          {assetType === 'image' ? (
            <div>
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                {!readonly && !disabled && !confirmDelete && (
                  <>
                    <label
                      htmlFor={`${id}-replace`}
                      className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded shadow cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Cambiar
                    </label>
                    <input
                      type="file"
                      id={`${id}-replace`}
                      accept={accept}
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                      title="Eliminar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Subido
                </div>
              </div>
              {!readonly && !disabled && confirmDelete && (
                <div className="mt-1.5 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-700">¿Eliminar este asset? Esta acción es irreversible.</p>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="text-xs text-gray-600 hover:text-gray-800 cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirmed}
                      disabled={deleting}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                    >
                      {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : assetType === 'audio' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <audio controls src={previewUrl} className="w-full h-8" />
              {!readonly && !disabled && (
                confirmDelete ? (
                  <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-700">¿Eliminar? Esta acción es irreversible.</p>
                    <div className="flex gap-2 shrink-0 ml-3">
                      <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="text-xs text-gray-600 hover:text-gray-800 cursor-pointer disabled:opacity-50">
                        Cancelar
                      </button>
                      <button type="button" onClick={handleDeleteConfirmed} disabled={deleting} className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer disabled:opacity-50">
                        {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <label htmlFor={`${id}-replace`} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      Cambiar
                    </label>
                    <input type="file" id={`${id}-replace`} accept={accept} onChange={handleFileSelect} disabled={uploading} className="hidden" />
                    <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-red-600 hover:text-red-700 flex items-center cursor-pointer">
                      <X className="w-3 h-3 mr-1" />
                      Eliminar
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <File className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{previewUrl}</span>
              </div>
              {!readonly && !disabled && (
                confirmDelete ? (
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="text-xs text-gray-600 cursor-pointer disabled:opacity-50">Cancelar</button>
                    <button type="button" onClick={handleDeleteConfirmed} disabled={deleting} className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50">
                      {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="ml-2 text-red-600 hover:text-red-700 shrink-0 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {!previewUrl && !readonly && !disabled && (
        <div className="relative mb-2">
          <input
            type="file"
            id={id}
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor={id}
            className={`
              flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer
              transition-colors text-center
              ${uploading
                ? 'border-violet-300 bg-violet-50 cursor-not-allowed'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
            `}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-violet-600 animate-spin mb-1" />
            ) : (
              <>
                <div className="text-gray-400 mb-1">{getIcon()}</div>
                <p className="text-xs text-gray-600 font-medium">Subir archivo</p>
                <p className="text-xs text-gray-500 mt-0.5 px-2">
                  {assetType === 'image' && 'PNG, JPG, WEBP'}
                  {assetType === 'audio' && 'MP3, WAV, OGG'}
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {uploading && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Subiendo...</span>
            <span className="text-violet-600 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
          <AlertCircle className="w-3 h-3 text-red-600 mr-1 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

async function uploadToR2(
  file: File,
  presignedUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

function getAcceptString(assetType: string): string {
  switch (assetType) {
    case 'image': return 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
    case 'audio': return 'audio/mpeg,audio/wav,audio/ogg';
    case 'model': return '.gltf,.glb,.obj,.fbx';
    case 'video': return 'video/mp4,video/webm';
    default:      return '*';
  }
}

export default AssetWidget;

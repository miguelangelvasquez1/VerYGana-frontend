import React, { useRef, useMemo } from 'react';
import type { FileWithPreview, GameAssetDefinition } from '@/types/games/campaigns';

interface Props {
  definition: GameAssetDefinition;
  files: FileWithPreview[];
  loading: boolean;
  onFileSelect: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
}

const MIME_TYPE_MAP: Record<string, string> = {
  IMAGE_PNG: 'image/png',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_WEBP: 'image/webp',
  AUDIO_MP3: 'audio/mpeg',
  AUDIO_OGG: 'audio/ogg',
  VIDEO_MP4: 'video/mp4',
};

export const AssetUploadCard: React.FC<Props> = ({
  definition,
  files,
  loading,
  onFileSelect,
  onRemoveFile,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChoose = () => {
    if (inputRef.current && !loading) {
      inputRef.current.click();
    }
  };

  const acceptAttr = useMemo(() => {
    if (!definition.allowedMimeTypes?.length) return undefined;

    return definition.allowedMimeTypes
      .map((t) => MIME_TYPE_MAP[t])
      .filter(Boolean)
      .join(',');
  }, [definition.allowedMimeTypes]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-800">
            {definition.description || 'Asset'}
            {definition.required ? ' *' : ''}
          </p>

          <p className="text-sm text-gray-600">
            {definition.assetType} · {definition.mediaType}
          </p>

          {definition.allowedMimeTypes?.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Tipos permitidos:{' '}
              {definition.allowedMimeTypes
                .map((t) => t.replace('_', '/').toLowerCase())
                .join(', ')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleChoose}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Seleccionar
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={!!definition.multiple}
        accept={acceptAttr}
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
      />

      <div className="mt-3 grid grid-cols-3 gap-3">
        {files.length === 0 && (
          <div className="col-span-3 text-sm text-gray-500">
            No hay archivos seleccionados.
          </div>
        )}

        {files.map((f, idx) => {
          const isImage = f.file.type.startsWith('image/');
          return (
            <div
              key={f.preview + idx}
              className="relative border rounded-md overflow-hidden bg-white"
            >
              <div className="w-full h-28 flex items-center justify-center bg-gray-100">
                {isImage ? (
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className="object-contain max-h-28"
                  />
                ) : (
                  <div className="p-2 text-sm text-gray-700 text-center">
                    <div className="font-medium">{f.file.name}</div>
                    <div className="text-xs text-gray-500">{f.file.type}</div>
                  </div>
                )}
              </div>

              <div className="p-2 flex items-center justify-between">
                <div className="text-xs text-gray-600 truncate">
                  {f.file.name}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  disabled={loading}
                  className="ml-2 text-red-600 hover:text-red-800 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

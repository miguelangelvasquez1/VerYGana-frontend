// components/widgets/AssetWidget.tsx
import React, { useState, useCallback } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image, Music, File } from 'lucide-react';
import { uploadAsset } from '@/services/games-campaigns/assetService2';

export const AssetWidget: React.FC<WidgetProps> = (props) => {
  const { id, value, onChange, label, required, readonly, disabled, options } = props;
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  
  const assetType = options?.assetType || 'image';
  const accept = getAcceptString(assetType);
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setUploading(true);
    setProgress(0);
    
    try {
      const uploadData = await uploadAsset.requestUploadUrl({
        originalFileName: file.name,
        contentType: file.type,
        sizeBytes: file.size
      });
      
      await uploadToR2(file, uploadData.permission.uploadUrl, (progressPercent) => {
        setProgress(progressPercent);
      });
      
      await uploadAsset.confirmUpload({
        assetId: uploadData.assetId
      });
      
      onChange(uploadData.publicUrl);
      setPreview(uploadData.temporalUrl);
      
    } catch (err: any) {
      console.error('Asset upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onChange]);
  
  const handleRemove = useCallback(() => {
    onChange(undefined);
    setPreview(null);
  }, [onChange]);
  
  const getIcon = () => {
    switch (assetType) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="w-full">
      {/* Preview - Compact */}
      {preview && !uploading && (
        <div className="mb-2">
          {assetType === 'image' ? (
            <div className="relative group">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              {!readonly && !disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                  title="Eliminar"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Subido
              </div>
            </div>
          ) : assetType === 'audio' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <audio controls src={preview} className="w-full h-8" />
              {!readonly && !disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center cursor-pointer"
                >
                  <X className="w-3 h-3 mr-1" />
                  Eliminar
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{value}</span>
              </div>
              {!readonly && !disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-2 text-red-600 hover:text-red-700 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Upload Area - Compact */}
      {!preview && !readonly && !disabled && (
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
              ${uploading ? 'border-blue-300 bg-blue-50 cursor-not-allowed' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
            `}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1" />
            ) : (
              <>
                <div className="text-gray-400 mb-1">
                  {getIcon()}
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Subir archivo
                </p>
                <p className="text-xs text-gray-500 mt-0.5 px-2">
                  {assetType === 'image' && 'PNG, JPG, WEBP'}
                  {assetType === 'audio' && 'MP3, WAV, OGG'}
                </p>
              </>
            )}
          </label>
        </div>
      )}
      
      {/* Progress Bar - Compact */}
      {uploading && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Subiendo...</span>
            <span className="text-blue-600 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Error Message - Compact */}
      {error && (
        <div className="flex items-start bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
          <AlertCircle className="w-3 h-3 text-red-600 mr-1 flex-shrink-0 mt-0.5" />
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
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });
    
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

function getAcceptString(assetType: string): string {
  switch (assetType) {
    case 'image':
      return 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
    case 'audio':
      return 'audio/mpeg,audio/wav,audio/ogg';
    case 'model':
      return '.gltf,.glb,.obj,.fbx';
    case 'video':
      return 'video/mp4,video/webm';
    default:
      return '*';
  }
}

export default AssetWidget;
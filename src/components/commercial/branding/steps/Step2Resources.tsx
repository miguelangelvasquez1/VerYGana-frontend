'use client';

import React, { useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FileEntry } from '../branding.types';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 20 * 1024 * 1024;

interface Props {
  files: FileEntry[];
  onUpload: (file: File) => void;
  onRemoveFile: (localId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const Step2Resources: React.FC<Props> = ({
  files,
  onUpload,
  onRemoveFile,
  onBack,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmedCount = files.filter(f => f.status === 'confirmed').length;
  const hasUploading = files.some(f => f.status === 'uploading');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: tipo no permitido. Solo PNG, JPEG, WEBP.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: supera el límite de 20 MB`);
        continue;
      }
      onUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div>
        <h3 className="font-medium text-gray-900">Recursos corporativos</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Logos, guías de marca, imágenes. Mínimo 1 requerido · PNG, JPEG, WEBP · Máx 20 MB
        </p>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
      >
        <Upload size={28} className="text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">
          Haz clic para seleccionar archivos
        </span>
        <span className="text-xs text-gray-400">PNG, JPEG, WEBP · Máx 20 MB por archivo</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(f => (
            <div
              key={f.localId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-400">{(f.file.size / 1024).toFixed(0)} KB</p>
              </div>
              {f.status === 'uploading' && (
                <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
              )}
              {f.status === 'confirmed' && (
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              )}
              {f.status === 'error' && (
                <div className="flex items-center gap-1 shrink-0">
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="text-xs text-red-500 max-w-[120px] truncate">{f.error}</span>
                </div>
              )}
              {f.status !== 'uploading' && (
                <button
                  onClick={() => onRemoveFile(f.localId)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmedCount > 0 && (
        <p className="text-sm text-green-600 font-medium">
          {confirmedCount} archivo(s) confirmado(s)
        </p>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={confirmedCount === 0 || hasUploading}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

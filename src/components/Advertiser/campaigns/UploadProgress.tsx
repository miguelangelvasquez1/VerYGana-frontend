// components/campaigns/UploadProgress.tsx
'use client';

import React from 'react';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';

type UploadStatus = 'preparing' | 'uploading' | 'creating';

interface UploadProgressProps {
  progress: number;
  currentFile?: string;
  status: UploadStatus;
}

export function UploadProgress({
  progress,
  currentFile,
  status,
}: UploadProgressProps) {
  const getLabel = () => {
    switch (status) {
      case 'preparing':
        return 'Preparando archivos...';
      case 'creating':
        return 'Creando campaña...';
      default:
        return 'Subiendo archivos...';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'creating':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <Loader2 className="animate-spin text-blue-600" size={20} />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white border rounded-xl shadow-lg p-4 space-y-3 z-50">
      {/* Header */}
      <div className="flex items-center gap-2">
        {getIcon()}
        <h4 className="font-semibold text-gray-900">
          {getLabel()}
        </h4>
      </div>

      {/* Current file */}
      {status === 'uploading' && currentFile && (
        <p className="text-sm text-gray-600 truncate">
          {currentFile}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Math.round(progress)}%</span>
        {status === 'creating' && (
          <span>Finalizando…</span>
        )}
      </div>
    </div>
  );
}

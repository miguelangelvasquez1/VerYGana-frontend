// components/campaigns/CreateCampaignForm.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useGames } from '@/hooks/campaigns/useGames';
import { useGameAssetDefinitions } from '@/hooks/campaigns/useGameAssetDefinitions';
import { useCampaignUpload } from '@/hooks/campaigns/useCampaignUpload';
import {
  Game,
  FileWithPreview,
  isValidFileSize,
  isValidFileType,
} from '@/types/campaigns';

// Componentes
import { GameSelection } from './GameSelection';
import { StepIndicator } from './StepIndicator';
import { AssetUploadCard } from './AssetUploadCard';
import { UploadProgress } from './UploadProgress';

interface CreateCampaignFormProps {
  advertiserId: number;
  onSuccess?: (campaignId: number) => void;
  onCancel?: () => void;
}

type Step = 'select-game' | 'upload-assets';

export function CreateCampaignForm({
  advertiserId,
  onSuccess,
  onCancel,
}: CreateCampaignFormProps) {
  // State
  const [step, setStep] = useState<Step>('select-game');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [files, setFiles] = useState<Map<number, FileWithPreview[]>>(new Map());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Queries
  // Games (respuesta paginada)
  const {data: gamesPage, isLoading: loadingGames, error: gamesError} = useGames();

  // Lista real de juegos
  const games = gamesPage?.content ?? [];

  const {
    data: assetDefinitions = [],
    isLoading: loadingDefinitions,
    error: definitionsError,
  } = useGameAssetDefinitions(selectedGame?.id ?? null);

  // Upload hook
  const { uploadState, uploadCampaign, resetUpload } = useCampaignUpload({
    gameId: selectedGame?.id ?? 0,
    advertiserId,
    onSuccess: (campaignId) => {
      // Limpiar previews
      files.forEach((fileList) => {
        fileList.forEach((f) => URL.revokeObjectURL(f.preview));
      });
      onSuccess?.(campaignId);
    },
    onError: (error) => {
      setValidationError(error);
    },
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((fileList) => {
        fileList.forEach((f) => URL.revokeObjectURL(f.preview));
      });
    };
  }, []);

  // Handlers
  const handleGameSelect = useCallback((game: Game) => {
    setSelectedGame(game);
    setStep('upload-assets');
    setFiles(new Map());
    setValidationError(null);
  }, []);

  const handleFileSelect = useCallback(
    (definitionId: number, selectedFiles: FileList | null) => {
      // selectedFiles can be null when used from input.files, bail out early
      if (!selectedFiles) return;

      const definition = assetDefinitions.find((d) => d.id === definitionId);
      if (!definition) return;

      const newFiles: FileWithPreview[] = Array.from(selectedFiles).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        definitionId,
        uploading: false,
        uploaded: false,
        progress: 0,
      }));

      // Validar archivos
      for (const fileItem of newFiles) {
        if (!isValidFileType(fileItem.file, definition.mediaType)) {
          setValidationError(
            `Tipo de archivo no válido para ${definition.assetType}`
          );
          return;
        }

        if (!isValidFileSize(fileItem.file, definition.mediaType)) {
          setValidationError(
            `Archivo demasiado grande: ${fileItem.file.name}`
          );
          return;
        }
      }

      setFiles((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(definitionId) || [];

        // Si no permite múltiples, reemplazar
        if (!definition.multiple) {
          existing.forEach((f) => URL.revokeObjectURL(f.preview));
          updated.set(definitionId, newFiles);
        } else {
          updated.set(definitionId, [...existing, ...newFiles]);
        }

        return updated;
      });

      setValidationError(null);
    },
    [assetDefinitions]
  );

  const handleRemoveFile = useCallback(
    (definitionId: number, index: number) => {
      setFiles((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(definitionId) || [];
        const file = existing[index];

        if (file) {
          URL.revokeObjectURL(file.preview);
        }

        existing.splice(index, 1);
        if (existing.length === 0) {
          updated.delete(definitionId);
        } else {
          updated.set(definitionId, existing);
        }

        return updated;
      });
    },
    []
  );

  const validateAssets = useCallback((): boolean => {
    const requiredDefinitions = assetDefinitions.filter((d) => d.required);

    for (const def of requiredDefinitions) {
      const defFiles = files.get(def.id);
      if (!defFiles || defFiles.length === 0) {
        setValidationError(`Falta el asset requerido: ${def.description}`);
        return false;
      }
    }

    return true;
  }, [assetDefinitions, files]);

  const handleSubmit = useCallback(async () => {
    if (!validateAssets() || !selectedGame) return;

    try {
      await uploadCampaign(files, assetDefinitions, setFiles);
    } catch (error) {
      // Error ya manejado por el hook
      console.error('Upload error:', error);
    }
  }, [validateAssets, selectedGame, uploadCampaign, files, assetDefinitions]);

  const handleBack = useCallback(() => {
    setStep('select-game');
    setSelectedGame(null);
    files.forEach((fileList) => {
      fileList.forEach((f) => URL.revokeObjectURL(f.preview));
    });
    setFiles(new Map());
    setValidationError(null);
    resetUpload();
  }, [files, resetUpload]);

  // Render
  const isLoading =
    uploadState.status === 'preparing' ||
    uploadState.status === 'uploading' ||
    uploadState.status === 'creating';

  const canSubmit =
    !isLoading && files.size > 0 && step === 'upload-assets';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <StepIndicator currentStep={step} />

        {/* Step 1: Select Game */}
        {step === 'select-game' && (
          <GameSelection
            games={games}
            loading={loadingGames}
            error={gamesError?.message}
            onSelect={handleGameSelect}
          />
        )}

        {/* Step 2: Upload Assets */}
        {step === 'upload-assets' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sube los assets para: {selectedGame?.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Completa todos los assets requeridos para tu campaña
                </p>
              </div>
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cambiar juego
              </button>
            </div>

            {/* Error Alert */}
            {(validationError || uploadState.error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">
                    {validationError || uploadState.error}
                  </p>
                </div>
              </div>
            )}

            {/* Loading Definitions */}
            {loadingDefinitions && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600">Cargando requisitos...</span>
              </div>
            )}

            {/* Asset Upload Cards */}
            {!loadingDefinitions &&
              assetDefinitions.map((definition) => (
                <AssetUploadCard
                  key={definition.id}
                  definition={definition}
                  files={files.get(definition.id) || []}
                  loading={isLoading}
                  onFileSelect={(selectedFiles) =>
                    handleFileSelect(definition.id, selectedFiles)
                  }
                  onRemoveFile={(index) =>
                    handleRemoveFile(definition.id, index)
                  }
                />
              ))}

            {/* Upload Progress */}
            {isLoading && uploadState.progress > 0 && (
              <UploadProgress
                progress={uploadState.progress}
                currentFile={uploadState.currentFile}
                status={
                  uploadState.status === 'preparing'
                    ? 'preparing'
                    : uploadState.status === 'creating'
                    ? 'creating'
                    : 'uploading'
                }
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadState.status === 'preparing' && 'Preparando...'}
                    {uploadState.status === 'uploading' && 'Subiendo...'}
                    {uploadState.status === 'creating' && 'Creando campaña...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Crear Campaña
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
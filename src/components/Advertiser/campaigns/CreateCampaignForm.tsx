// components/campaigns/CreateCampaignForm.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

// Hooks
import { useGames, useGameSchema } from '@/hooks/campaigns/querys';

// Types
import {
  Game,
  CampaignDetails, 
} from '@/types/games/campaigns';

// Components
import { GameSelection } from './GameSelection';
import { StepIndicator } from './StepIndicator';
import { CampaignDetailsForm } from './CampaignsDetailsForm';
import { GameConfigForm } from './GameConfigForm';
import { CampaignSummary } from './CampaignSummary';
import { useCreateCampaign } from '@/hooks/campaigns/mutations';
import { CreateCampaignRequest } from '@/services/games-campaigns/campaignService';

interface CreateCampaignFormProps {
  onSuccess?: (success: boolean) => void;
  onCancel?: () => void;
}

type Step = 'select-game' | 'campaign-details' | 'game-config' | 'review-summary';

export function CreateCampaignForm({
  onSuccess,
  onCancel,
}: CreateCampaignFormProps) {
  const router = useRouter();
  const { mutateAsync: createCampaign, isPending } = useCreateCampaign();

  // State
  const [step, setStep] = useState<Step>('select-game');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({
    budget: 0,
    coinValue: 0,
    completionCoins: 0,
    budgetCoins: 0,
    maxCoinsPerSession: 0,
    maxSessionsPerUserPerDay: 0,
    targetUrl: null,
    categoryIds: [],
    targetAudience: {
      minAge: 18,
      maxAge: 65,
      gender: 'ALL',
      municipalityCodes: [],
    },
    gameConfig: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: gamesPage, isLoading: loadingGames, error: gamesError } = useGames();
  const games = gamesPage?.content ?? [];

  const {
    data: gameSchemaResponse,
    isLoading: loadingSchema,
    error: schemaError,
  } = useGameSchema(selectedGame?.id ?? null);

  // Handlers
  const handleGameSelect = useCallback((game: Game) => {
    setSelectedGame(game);
    setStep('campaign-details');
  }, []);

  const handleCampaignDetailsSubmit = useCallback((details: CampaignDetails) => {
    setCampaignDetails(details);
    setStep('game-config');
  }, []);

  const handleGameConfigSubmit = useCallback((gameConfig: any) => {
    setCampaignDetails(prev => ({ ...prev, gameConfig }));
    setStep('review-summary');
  }, []);

  const handleEditDetails = useCallback(() => {
    setStep('campaign-details');
  }, []);

  const handleEditConfig = useCallback(() => {
    setStep('game-config');
  }, []);

  // Create campaign
  const handleConfirmAndCreate = useCallback(async () => {
    if (!selectedGame) return;

    try {
      await createCampaign(
        buildCreateCampaignRequest(selectedGame.id, campaignDetails)
      );

      onSuccess?.(true);
      router.push('/advertiser/campaigns');
    } catch (error) {
      console.error(error);
      alert('Error al crear la campaña.');
    }
  }, [selectedGame, campaignDetails, createCampaign, router, onSuccess]);


  const handleBack = useCallback(() => {
    if (step === 'campaign-details') {
      setStep('select-game');
      setSelectedGame(null);
    } else if (step === 'game-config') {
      setStep('campaign-details');
    } else if (step === 'review-summary') {
      setStep('game-config');
    }
  }, [step]);

  const handleCancelAll = useCallback(() => {
    setStep('select-game');
    setSelectedGame(null);
    setCampaignDetails({
      budget: 0,
      coinValue: 0,
      completionCoins: 0,
      budgetCoins: 0,
      maxCoinsPerSession: 0,
      maxSessionsPerUserPerDay: 0,
      targetUrl: null,
      categoryIds: [],
      targetAudience: {
        minAge: 18,
        maxAge: 65,
        gender: 'ALL',
        municipalityCodes: [],
      },
      gameConfig: undefined,
    });
    onCancel?.();
  }, [onCancel]);

  function buildCreateCampaignRequest(
    gameId: number,
    details: CampaignDetails
  ): CreateCampaignRequest {
    return {
      gameId,
      budget: details.budget,
      coinValue: details.coinValue,
      completionCoins: details.completionCoins,
      budgetCoins: details.budgetCoins,
      maxCoinsPerSession: details.maxCoinsPerSession,
      maxSessionsPerUserPerDay: details.maxSessionsPerUserPerDay,
      targetUrl: details.targetUrl || undefined,
      categoryIds: details.categoryIds,
      targetAudience: details.targetAudience,
      configData: details.gameConfig ?? {},
    };
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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

        {/* Step 2: Campaign Details */}
        {step === 'campaign-details' && selectedGame && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles de la campaña: {selectedGame.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configura el presupuesto y audiencia de tu campaña
                </p>
              </div>
              <button
                onClick={handleBack}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cambiar juego
              </button>
            </div>

            <CampaignDetailsForm
              initialDetails={campaignDetails}
              onSubmit={handleCampaignDetailsSubmit}
              onCancel={handleCancelAll}
            />
          </div>
        )}

        {/* Step 3: Game Config */}
        {step === 'game-config' && selectedGame && (
          <div className="space-y-6">
            {schemaError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error cargando configuración</p>
                  <p className="text-sm text-red-700 mt-1">{schemaError.message}</p>
                </div>
              </div>
            )}

            {loadingSchema ? (
              <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-700 font-medium">Cargando configuración del juego...</span>
              </div>
            ) : (
              <GameConfigForm
                gameTitle={selectedGame.title}
                jsonSchema={gameSchemaResponse?.jsonSchema ?? {}}
                uiSchema={gameSchemaResponse?.uiSchema}
                initialData={campaignDetails.gameConfig}
                loading={loadingSchema}
                onSubmit={handleGameConfigSubmit}
                onBack={handleBack}
              />
            )}
          </div>
        )}

        {/* Step 4: Review Summary */}
        {step === 'review-summary' && selectedGame && (
          <CampaignSummary
            gameTitle={selectedGame.title}
            campaignDetails={campaignDetails}
            onBack={handleBack}
            onConfirm={handleConfirmAndCreate}
            onEditDetails={handleEditDetails}
            onEditConfig={handleEditConfig}
            loading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
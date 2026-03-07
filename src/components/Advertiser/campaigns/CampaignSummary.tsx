// components/campaigns/CampaignSummary.tsx
'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Edit2, 
  ChevronDown,
  ChevronRight,
  DollarSign,
  Users,
  Target,
  Calendar,
  Tag,
  Globe,
  Settings,
  Gamepad2
} from 'lucide-react';
import { CampaignDetails } from '@/types/games/campaigns';

interface CampaignSummaryProps {
  gameTitle: string;
  campaignDetails: CampaignDetails;
  onBack: () => void;
  onConfirm: () => void;
  onEditDetails: () => void;
  onEditConfig: () => void;
  loading?: boolean;
}

export function CampaignSummary({
  gameTitle,
  campaignDetails,
  onBack,
  onConfirm,
  onEditDetails,
  onEditConfig,
  loading = false,
}: CampaignSummaryProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [configExpanded, setConfigExpanded] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      'ALL': 'Todos',
      'MALE': 'Masculino',
      'FEMALE': 'Femenino',
      'OTHER': 'Otro',
    };
    return labels[gender] || gender;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Revisar Campaña
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Verifica que toda la información sea correcta antes de crear la campaña
        </p>
      </div>

      {/* Game Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-lg">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Juego Seleccionado</p>
            <h4 className="text-xl font-bold text-gray-900">{gameTitle}</h4>
          </div>
        </div>
      </div>

      {/* Campaign Details Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-semibold text-gray-900">
                Detalles de la Campaña
              </h4>
              <p className="text-sm text-gray-500">
                Presupuesto, audiencia y configuración comercial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditDetails();
              }}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
            {detailsExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {detailsExpanded && (
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Section */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Presupuesto</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(campaignDetails.budget)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Valor por Moneda</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(campaignDetails.coinValue)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Monedas por Completar</p>
                    <p className="text-lg font-bold text-gray-900">
                      {campaignDetails.completionCoins} monedas
                    </p>
                  </div>
                </div>
              </div>

              {/* Limits Section */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Monedas Máximas por Sesión</p>
                    <p className="text-lg font-bold text-gray-900">
                      {campaignDetails.maxCoinsPerSession} monedas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Sesiones Máximas por Día</p>
                    <p className="text-lg font-bold text-gray-900">
                      {campaignDetails.maxSessionsPerUserPerDay} sesiones
                    </p>
                  </div>
                </div>

                {campaignDetails.targetUrl && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">URL Objetivo</p>
                      <a 
                        href={campaignDetails.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 truncate block"
                      >
                        {campaignDetails.targetUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-gray-700" />
                <h5 className="font-semibold text-gray-900">Audiencia Objetivo</h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rango de Edad</p>
                  <p className="text-sm font-medium text-gray-900">
                    {campaignDetails.targetAudience.minAge} - {campaignDetails.targetAudience.maxAge} años
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Género</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getGenderLabel(campaignDetails.targetAudience.gender)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Municipios</p>
                  <p className="text-sm font-medium text-gray-900">
                    {campaignDetails.targetAudience.municipalityCodes?.length || 0} seleccionados
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            {campaignDetails.categoryIds && campaignDetails.categoryIds.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-gray-700" />
                  <h5 className="font-semibold text-gray-900">Categorías</h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaignDetails.categoryIds.map((catId, index) => (
                    <span
                      key={catId}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      Categoría {index + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Configuration Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-semibold text-gray-900">
                Configuración del Juego
              </h4>
              <p className="text-sm text-gray-500">
                Personalización visual, audio y contenido
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditConfig();
              }}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
            {configExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {configExpanded && (
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
            {campaignDetails.gameConfig ? (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-sm font-mono text-gray-300 ml-2">config.json</p>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(campaignDetails.gameConfig, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No se ha configurado el juego</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-semibold shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creando campaña...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Confirmar y Crear Campaña
            </>
          )}
        </button>
      </div>
    </div>
  );
}
// components/campaigns/CampaignCard.tsx
'use client';

import React from 'react';
import { Play, Pause, Edit, Trash2, BarChart3, Ban, CheckCircle } from 'lucide-react';
import { Campaign } from '@/types/campaigns';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
  onCancel: (campaign: Campaign) => void;
  isUpdating: boolean;
}

export function CampaignCard({
  campaign,
  onEdit,
  onToggleStatus,
  onCancel,
  isUpdating,
}: CampaignCardProps) {

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      ACTIVE: 'Activa',
      PAUSED: 'Pausada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      DRAFT: 'Borrador',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.DRAFT}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Determinar si puede editarse (solo DRAFT o PAUSED)
  const canEdit = campaign.status === 'DRAFT' || campaign.status === 'PAUSED';

  // Determinar si puede pausarse/activarse
  const canToggle = campaign.status === 'ACTIVE' || campaign.status === 'PAUSED';

  // Determinar si puede cancelarse (desde ACTIVE o PAUSED)
  const canCancel = campaign.status === 'ACTIVE' || campaign.status === 'PAUSED';

  // Determinar si puede eliminarse (generalmente solo DRAFT o CANCELLED)
  const canDelete = campaign.status === 'DRAFT' || campaign.status === 'CANCELLED';

  // Determinar si puede activarse desde DRAFT
  const canActivateFromDraft = campaign.status === 'DRAFT';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {campaign.gameTitle ? `Campaña para Juego ${campaign.gameTitle}` : 'Campaña'}
          </h3>
          {campaign.createdAt && (
            <p className="text-sm text-gray-600 mt-1">
              Creada: {new Date(campaign.createdAt).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(campaign.status)}
          <div className="flex space-x-1">
            {/* Activar desde DRAFT */}
            {canActivateFromDraft && (
              <button
                onClick={() => onToggleStatus(campaign)}
                disabled={isUpdating}
                className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                title="Activar campaña"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}

            {/* Pausar/Activar (solo para ACTIVE o PAUSED) */}
            {canToggle && (
              <button
                onClick={() => onToggleStatus(campaign)}
                disabled={isUpdating}
                className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                  campaign.status === 'ACTIVE'
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title={campaign.status === 'ACTIVE' ? 'Pausar campaña' : 'Activar campaña'}
              >
                {campaign.status === 'ACTIVE' ? 
                  <Pause className="w-4 h-4" /> : 
                  <Play className="w-4 h-4" />
                }
              </button>
            )}
            
            {/* Editar (solo DRAFT o PAUSED) */}
            {canEdit && (
              <button 
                onClick={() => onEdit(campaign)}
                className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                title="Editar campaña"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {/* Cancelar (desde ACTIVE o PAUSED) */}
            {canCancel && (
              <button 
                onClick={() => onCancel(campaign)}
                disabled={isUpdating}
                className="p-2 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50"
                title="Cancelar campaña"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}

            {/* Estadísticas */}
            <button 
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Ver estadísticas"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Presupuesto</p>
          <p className="text-lg font-semibold text-gray-900">
            ${campaign.budget.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Gastado</p>
          <p className="text-lg font-semibold text-red-600">
            ${campaign.spent.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Sesiones jugadas</p>
          <p className="text-lg font-semibold text-blue-600">
            {(campaign.sessionsPlayed ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Sesiones completadas</p>
          <p className="text-lg font-semibold text-green-600">
            {(campaign.completedSessions ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-center mb-4">
        <p className="text-sm text-gray-600">Tiempo total jugado</p>
        <p className="text-lg font-semibold text-purple-600">
          {Math.floor((campaign.totalPlayTimeSeconds ?? 0) / 60)} min
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%`
          }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {((campaign.spent / campaign.budget) * 100).toFixed(1)}% del presupuesto utilizado
      </p>

      {/* Advertencias según estado */}
      {campaign.status === 'DRAFT' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Esta campaña está en borrador. Actívala para que comience a mostrarse.
          </p>
        </div>
      )}

      {campaign.status === 'CANCELLED' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ Esta campaña ha sido cancelada y no puede modificarse.
          </p>
        </div>
      )}

      {campaign.status === 'COMPLETED' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ Esta campaña ha sido completada y no puede modificarse.
          </p>
        </div>
      )}
    </div>
  );
}
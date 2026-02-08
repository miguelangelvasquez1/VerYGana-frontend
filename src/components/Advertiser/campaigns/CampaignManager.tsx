// components/campaigns/CampaignManager.tsx
'use client';

import React, { useState } from 'react';
import { Plus, BarChart3, ArrowLeft } from 'lucide-react';
import { CreateCampaignForm } from './CreateCampaignForm';
import { EditCampaignModal } from './EditCampaignModal';
import { CampaignCard } from './CampaignCard';
import { useCampaigns, useUpdateCampaignStatus } from '@/hooks/campaigns/useCampaigns';
import { Campaign } from '@/types/games/campaigns';

export function CampaignManager() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Queries y mutations
  const { data: campaignsPage, isLoading, error } = useCampaigns(0, 10);
  const updateStatusMutation = useUpdateCampaignStatus();

  const campaigns = campaignsPage ?? [];

  /**
   * Valida las transiciones de estado según las reglas del backend
   */
  const validateStatusTransition = (campaign: Campaign, toStatus: string
  ): { valid: boolean; error?: string } => {

    const fromStatus = campaign.status;

    if (fromStatus === toStatus) {
      return { valid: false, error: 'La campaña ya está en ese estado' };
    }

    switch (fromStatus) {
      case 'DRAFT':
        if (toStatus !== 'ACTIVE' && toStatus !== 'PAUSED') {
          return { valid: false, error: 'Desde BORRADOR solo puedes activar o pausar la campaña' };
        }
        break;

      case 'ACTIVE':
        if (toStatus !== 'PAUSED' && toStatus !== 'CANCELLED') {
          return { valid: false, error: 'Desde ACTIVA solo puedes pausar o cancelar la campaña' };
        }
        break;

      case 'PAUSED':
        if (toStatus !== 'ACTIVE' && toStatus !== 'CANCELLED') {
          return { valid: false, error: 'Desde PAUSADA solo puedes activar o cancelar la campaña' };
        }
        break;

      case 'CANCELLED':
        return { valid: false, error: 'Una campaña cancelada no puede modificarse' };

      case 'COMPLETED':
        return { valid: false, error: 'Una campaña completada no puede modificarse' };

      default:
        return { valid: false, error: 'Estado de campaña desconocido' };
    }

    return { valid: true };
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    // Determinar el nuevo estado según el estado actual
    let newStatus: string;
    
    if (campaign.status === 'DRAFT') {
      // Desde DRAFT, intentar activar
      newStatus = 'ACTIVE';
    } else if (campaign.status === 'ACTIVE') {
      // Desde ACTIVE, pausar
      newStatus = 'PAUSED';
    } else if (campaign.status === 'PAUSED') {
      // Desde PAUSED, activar
      newStatus = 'ACTIVE';
    } else {
      alert('No se puede cambiar el estado de esta campaña');
      return;
    }
console.log(campaign.status);
    // Validar la transición
    const validation = validateStatusTransition(campaign, newStatus);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        campaignId: Number(campaign.id),
        status: newStatus,
      });
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alert(error.response?.data?.message || 'Error al actualizar el estado de la campaña');
    }
  };

  const handleCancelCampaign = async (campaign: Campaign) => {
    // Validar que se puede cancelar
    const validation = validateStatusTransition(campaign, 'CANCELLED');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (!confirm('¿Estás seguro de cancelar esta campaña? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        campaignId: Number(campaign.id),
        status: 'CANCELLED',
      });
    } catch (error: any) {
      console.error('Error cancelando campaña:', error);
      alert(error.response?.data?.message || 'Error al cancelar la campaña');
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // Verificar que se puede editar (solo DRAFT o PAUSED)
    if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
      alert(`No se puede editar una campaña en estado ${campaign.status}. Solo se pueden editar campañas en BORRADOR o PAUSADAS.`);
      return;
    }
    setEditingCampaign(campaign);
  };

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setView('list')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Campaña</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura los assets y detalles de tu campaña publicitaria
            </p>
          </div>
        </div>

        <CreateCampaignForm
          onCancel={() => setView('list')} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Campañas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra tus campañas publicitarias activas y pasadas
          </p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Campaña
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando campañas...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error cargando campañas</p>
          <p className="text-red-600 text-sm mt-2">{error.message}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes campañas aún
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera campaña publicitaria para comenzar a promocionar tus productos en nuestros juegos.
            </p>
            <button 
              onClick={() => setView('create')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Campaña
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={handleEditCampaign}
              onToggleStatus={handleToggleStatus}
              onCancel={handleCancelCampaign}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
        />
      )}
    </div>
  );
}
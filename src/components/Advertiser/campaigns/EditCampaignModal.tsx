// components/campaigns/EditCampaignModal.tsx
'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Campaign, CampaignDetails } from '@/types/campaigns';
import { CampaignDetailsForm } from './CampaignsDetailsForm';
import { useUpdateCampaign, useUpdateCampaignStatus } from '@/hooks/campaigns/useCampaigns';

interface EditCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export function EditCampaignModal({ campaign, onClose }: EditCampaignModalProps) {
  
  const updateCampaignMutation = useUpdateCampaign();
  const updateStatusMutation = useUpdateCampaignStatus();

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleUpdateDetails = async (data: CampaignDetails) => {
    try {
      await updateCampaignMutation.mutateAsync({
        campaignId: Number(campaign.id),
        data,
      });
      onClose();
    } catch (error) {
      console.error('Error actualizando campaña:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`¿Estás seguro de ${newStatus === 'CANCELLED' ? 'cancelar' : 'cambiar el estado de'} esta campaña?`)) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        campaignId: Number(campaign.id),
        status: newStatus,
      });
      onClose();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  // Construir initial details desde la campaña existente
  const initialDetails: CampaignDetails = {
    budget: campaign.budget,
    targetUrl: campaign.targetUrl || '',
    categoryIds: campaign.categories?.map(cat => cat.id) || [],
    targetAudience: {
      minAge: campaign.minAge,
      maxAge: campaign.maxAge,
      gender: campaign.targetGender,
      municipalityCodes: campaign.targetMunicipalities?.map(m => m.code) || [],
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Editar Campaña
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                ID: {campaign.id} | Estado: {campaign.status}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div>
              <p className="text-sm text-gray-600 mb-6">
                Modifica el presupuesto y targeting de tu campaña
              </p>
              <CampaignDetailsForm
                initialDetails={initialDetails}
                existingCampaign={campaign}
                onSubmit={handleUpdateDetails}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
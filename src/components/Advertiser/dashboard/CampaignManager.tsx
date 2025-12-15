// components/campaigns/CampaignManager.tsx
'use client';

import React, { useState } from 'react';
import { Play, Pause, Edit, Trash2, Plus, BarChart3 } from 'lucide-react';
import { Campaign } from '@/types/ads/advertiser';

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Campaña Black Friday',
      ads: [], // Simplificado para el ejemplo
      totalBudget: 1000,
      totalSpent: 347.80,
      status: 'active',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      totalImpressions: 25430,
      totalClicks: 1247,
      averageCTR: 4.9
    },
    {
      id: '2',
      name: 'Promoción Producto Verano',
      ads: [],
      totalBudget: 750,
      totalSpent: 623.45,
      status: 'paused',
      startDate: new Date('2024-10-15'),
      endDate: new Date('2024-12-15'),
      totalImpressions: 18920,
      totalClicks: 876,
      averageCTR: 4.6
    }
  ]);

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      active: 'Activa',
      paused: 'Pausada',
      completed: 'Completada'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' }
        : campaign
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Campañas</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Campaña
        </button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {campaign.startDate.toLocaleDateString()} - {campaign.endDate?.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(campaign.status)}
                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    className={`p-2 rounded-md ${
                      campaign.status === 'active'
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {campaign.status === 'active' ? 
                      <Pause className="w-4 h-4" /> : 
                      <Play className="w-4 h-4" />
                    }
                  </button>
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Presupuesto</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${campaign.totalBudget.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Gastado</p>
                <p className="text-lg font-semibold text-red-600">
                  ${campaign.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Impresiones</p>
                <p className="text-lg font-semibold text-blue-600">
                  {campaign.totalImpressions.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Clicks</p>
                <p className="text-lg font-semibold text-green-600">
                  {campaign.totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">CTR Promedio</p>
                <p className="text-lg font-semibold text-purple-600">
                  {campaign.averageCTR.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((campaign.totalSpent / campaign.totalBudget) * 100, 100)}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {((campaign.totalSpent / campaign.totalBudget) * 100).toFixed(1)}% del presupuesto utilizado
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
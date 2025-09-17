'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Eye, MousePointer, DollarSign, MoreVertical } from 'lucide-react';
import { Ad } from '@/types/advertiser';

interface AdCardProps {
  ad: Ad;
  onEdit: (ad: Ad) => void;
  onPause: (adId: string) => void;
  onResume: (adId: string) => void;
  onDelete: (adId: string) => void;
}

export function AdCard({ ad, onEdit, onPause, onResume, onDelete }: AdCardProps) {
  const getStatusBadge = (status: Ad['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      paused: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      active: 'Activo',
      paused: 'Pausado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48 bg-gray-100">
        {ad.type === 'image' ? (
          <Image
            src={ad.fileUrl}
            alt={ad.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Video</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{ad.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{ad.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(ad.status)}
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Eye className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {ad.impressions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Impresiones</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MousePointer className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {ad.clicks.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              ${ad.spent.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Gastado</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              CTR: <span className="font-medium">{(ad.ctr * 100).toFixed(2)}%</span>
            </p>
            <p className="text-sm text-gray-600">
              CPC: <span className="font-medium">${ad.cpc.toFixed(2)}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(ad)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Editar
            </button>
            {ad.status === 'active' ? (
              <button
                onClick={() => onPause(ad.id)}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Pausar
              </button>
            ) : ad.status === 'paused' ? (
              <button
                onClick={() => onResume(ad.id)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Reanudar
              </button>
            ) : null}
          </div>
        </div>

        {ad.status === 'rejected' && ad.rejectedReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Motivo del rechazo:</strong> {ad.rejectedReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

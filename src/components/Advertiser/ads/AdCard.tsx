// components/ads/AdCard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Play, 
  Heart, 
  DollarSign, 
  Calendar, 
  Target, 
  TrendingUp, 
  Edit2, 
  Pause, 
  PlayCircle, 
  Trash2, 
  MoreVertical,
  X
} from 'lucide-react';
import { AdResponseDTO } from '@/types/ads/advertiser';

interface AdCardProps {
  ad: AdResponseDTO;
  onEdit: (ad: AdResponseDTO) => void;
  onPause: (adId: number) => void;
  onResume: (adId: number) => void;
  onDelete: (adId: number) => void;
}

export function AdCard({ ad, onEdit, onPause, onResume, onDelete }: AdCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: AdResponseDTO['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
      PAUSED: 'bg-gray-100 text-gray-800 border-gray-200',
      COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      ACTIVE: 'Activo',
      PAUSED: 'Pausado',
      COMPLETED: 'Completado',
      REJECTED: 'Rechazado'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Imagen/Video Preview */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {ad.contentUrl ? (
          ad.mediaType === 'VIDEO' ? (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="text-center">
                <Play className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700 font-medium">Video</p>
              </div>
            </div>
          ) : (
            <Image
              src={ad.contentUrl}
              alt={ad.title}
              fill
              className="object-cover"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Sin imagen</p>
          </div>
        )}
        
        {/* Badge de progreso y estado */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {getStatusBadge(ad.status)}
          <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
            <span className="text-xs font-bold text-gray-700">
              {ad.completionPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Header con título */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
            {ad.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {ad.description}
          </p>
        </div>

        {/* Categorías */}
        {ad.categories && ad.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ad.categories.slice(0, 3).map((category) => (
              <span
                key={category.id}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
              >
                {category.name}
              </span>
            ))}
            {ad.categories.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                +{ad.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">
              {ad.currentLikes}/{ad.maxLikes}
            </p>
            <p className="text-xs text-gray-500">Likes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">
              ${ad.spentBudget.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Gastado</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">
              ${ad.remainingBudget.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Restante</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span className="font-medium">Progreso</span>
            <span className="font-bold">{ad.completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(ad.completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-2 mb-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>Inicio: <strong>{formatDate(ad.startDate)}</strong></span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>Fin: <strong>{formatDate(ad.endDate)}</strong></span>
          </div>
          <div className="flex items-center">
            <Target className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span>
              <strong>{ad.targetGender === 'ALL' ? 'Todos' : ad.targetGender}</strong> • 
              <strong> {ad.minAge}-{ad.maxAge} años</strong>
            </span>
          </div>
        </div>

        {/* Botones de acción mejorados */}
        <div className="flex gap-2">
          {/* Botón Editar */}
          <button
            onClick={() => onEdit(ad)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>

          {/* Botón Pausar/Reanudar */}
          {ad.status === 'ACTIVE' && (
            <button
              onClick={() => onPause(ad.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition-colors shadow-sm"
              title="Pausar anuncio"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          )}
          
          {ad.status === 'PAUSED' && (
            <button
              onClick={() => onResume(ad.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
              title="Reanudar anuncio"
            >
              <PlayCircle className="w-4 h-4" />
              Activar
            </button>
          )}

          {/* Menú de más opciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 border-2 border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop para cerrar el menú */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  <button
                    onClick={(e) => handleMenuClick(e, () => onDelete(ad.id))}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar anuncio
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Motivo de rechazo */}
        {ad.status === 'REJECTED' && ad.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-xs text-red-800">
              <strong className="font-semibold block mb-1">❌ Motivo del rechazo:</strong>
              {ad.rejectionReason}
            </p>
          </div>
        )}

        {/* URL de destino */}
        {ad.targetUrl && (
          <div className="mt-3 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-gray-600 truncate">
              🔗 <span className="font-medium">{ad.targetUrl}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
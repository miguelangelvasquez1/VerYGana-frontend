import React from 'react';
import {
  Heart, DollarSign, TrendingUp, Calendar, Target, Users,
  CheckCircle, XCircle, Play, Pause, Ban, Eye, Video, Image as ImageIcon
} from 'lucide-react';
import { AdForAdminDTO } from '@/types/ads/advertiser';
import { AD_STATUS_STYLES, AD_STATUS_LABELS } from './utils/adConstants';
import { formatCurrency, formatDate } from './utils/adHelper';

interface AdCardProps {
  ad: AdForAdminDTO;
  onApprove: (id: number) => void;
  onReject: (ad: AdForAdminDTO) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onBlock: (ad: AdForAdminDTO) => void;
  onPreview: (ad: AdForAdminDTO) => void;
  isLoading: {
    approve: boolean;
    reject: boolean;
    pause: boolean;
    resume: boolean;
    block: boolean;
  };
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  onApprove,
  onReject,
  onPause,
  onResume,
  onBlock,
  onPreview,
  isLoading,
}) => {
  const getStatusBadge = (status: string) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${AD_STATUS_STYLES[status as keyof typeof AD_STATUS_STYLES]}`}>
      {AD_STATUS_LABELS[status as keyof typeof AD_STATUS_LABELS]}
    </span>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Media Preview */}
      <div 
        className={`relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 ${ad.contentUrl ? 'cursor-pointer' : ''}`} 
        onClick={() => ad.contentUrl && onPreview(ad)}
      >
        {ad.contentUrl ? (
          ad.mediaType === 'VIDEO' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-12 h-12 text-blue-600" />
            </div>
          ) : (
            <img 
              src={ad.contentUrl} 
              alt={ad.title} 
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          {getStatusBadge(ad.status)}
        </div>

        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="text-xs font-bold text-gray-700">
            {ad.completionPercentage.toFixed(0)}%
          </span>
        </div>

        {ad.contentUrl && (
          <div className="absolute bottom-3 right-3 bg-white/80 p-1.5 rounded-full shadow-md hover:bg-white transition-colors">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {ad.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {ad.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-100">
          <div className="text-center">
            <Heart className="w-4 h-4 text-pink-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">
              {ad.currentLikes}/{ad.maxLikes}
            </p>
            <p className="text-xs text-gray-500">Likes</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">
              {formatCurrency(ad.spentBudget)}
            </p>
            <p className="text-xs text-gray-500">Gastado</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">
              {formatCurrency(ad.remainingBudget)}
            </p>
            <p className="text-xs text-gray-500">Restante</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 mb-4 text-xs text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-2" />
            <span>Inicio: {formatDate(ad.startDate)}</span>
          </div>
          <div className="flex items-center">
            <Target className="w-3.5 h-3.5 mr-2" />
            <span>{ad.targetGender} • {ad.minAge}-{ad.maxAge} años</span>
          </div>
          <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-2" />
            <span>Anunciante: {ad.advertiserName || `ID: ${ad.advertiserId}`}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso</span>
            <span>{ad.completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(ad.completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <AdCardActions
          ad={ad}
          onApprove={onApprove}
          onReject={onReject}
          onPause={onPause}
          onResume={onResume}
          onBlock={onBlock}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// Subcomponente para las acciones
interface AdCardActionsProps {
  ad: AdForAdminDTO;
  onApprove: (id: number) => void;
  onReject: (ad: AdForAdminDTO) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onBlock: (ad: AdForAdminDTO) => void;
  isLoading: {
    approve: boolean;
    reject: boolean;
    pause: boolean;
    resume: boolean;
    block: boolean;
  };
}

const AdCardActions: React.FC<AdCardActionsProps> = ({
  ad,
  onApprove,
  onReject,
  onPause,
  onResume,
  onBlock,
  isLoading,
}) => {
  switch (ad.status) {
    case 'PENDING':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(ad.id)}
            disabled={isLoading.approve}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar
          </button>
          <button
            onClick={() => onReject(ad)}
            disabled={isLoading.reject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      );

    case 'APPROVED':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onResume(ad.id)}
            disabled={isLoading.resume}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Play className="w-4 h-4" />
            Activar
          </button>
          <button
            onClick={() => onBlock(ad)}
            disabled={isLoading.block}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Ban className="w-4 h-4" />
            Bloquear
          </button>
        </div>
      );

    case 'ACTIVE':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onPause(ad.id)}
            disabled={isLoading.pause}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
          <button
            onClick={() => onBlock(ad)}
            disabled={isLoading.block}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Ban className="w-4 h-4" />
            Bloquear
          </button>
        </div>
      );

    case 'PAUSED':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onResume(ad.id)}
            disabled={isLoading.resume}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
            >
            <Play className="w-4 h-4" />
            Reanudar
          </button>
          <button
            onClick={() => onBlock(ad)}
            disabled={isLoading.block}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Ban className="w-4 h-4" />
            Bloquear
          </button>
        </div>
      );

    case 'BLOCKED':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onResume(ad.id)}
            disabled={isLoading.resume}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
            >
            <Play className="w-4 h-4" />
            Reanudar
          </button>
          <button
            onClick={() => onPause(ad.id)}
            disabled={isLoading.pause}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 text-white py-2 px-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        </div>
      );

    case 'REJECTED':
      return ad.rejectionReason ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800">
            <strong className="font-semibold">Razón:</strong> {ad.rejectionReason}
          </p>
        </div>
      ) : null;

    default:
      return null;
  }
};
import React from 'react';
import {
  Video, Image as ImageIcon, Eye,
  CheckCircle, XCircle, Play, Pause, Ban, Info,
} from 'lucide-react';
import { AdForAdminDTO } from '@/types/ads/commercial';
import { AD_STATUS_STYLES, AD_STATUS_LABELS } from './utils/adConstants';
import { formatCurrency, formatDate } from './utils/adHelper';

interface AdCardProps {
  ad: AdForAdminDTO;
  onApprove: (id: number) => void;
  onReject: (ad: AdForAdminDTO) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onBlock: (ad: AdForAdminDTO) => void;
  onViewDetail: (ad: AdForAdminDTO) => void;
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
  onViewDetail,
  isLoading,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 px-5 py-4">

      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        {ad.contentUrl && ad.mediaType === 'IMAGE' ? (
          <img src={ad.contentUrl} alt={ad.title} className="w-full h-full object-cover" />
        ) : ad.mediaType === 'VIDEO' ? (
          <Video className="w-6 h-6 text-slate-400" />
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-400" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-gray-900 truncate">{ad.title}</h3>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${AD_STATUS_STYLES[ad.status as keyof typeof AD_STATUS_STYLES]}`}>
            {AD_STATUS_LABELS[ad.status as keyof typeof AD_STATUS_LABELS]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {/* Type badge */}
          <span className="flex items-center gap-1">
            {ad.mediaType === 'VIDEO'
              ? <Video className="w-3 h-3" />
              : <ImageIcon className="w-3 h-3" />}
            {ad.mediaType === 'VIDEO' ? 'Video' : 'Imagen'}
          </span>

          {/* Progress */}
          <span className="flex items-center gap-1.5">
            <span className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden inline-block align-middle">
              <span
                className="block h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(ad.completionPercentage, 100)}%` }}
              />
            </span>
            {ad.completionPercentage.toFixed(0)}%
          </span>

          {/* Budget */}
          <span>{formatCurrency(ad.spentBudget)} / {formatCurrency(ad.totalBudget)}</span>

          {/* Likes */}
          <span>{ad.currentLikes}/{ad.maxLikes} likes</span>

          {/* Advertiser */}
          <span className="truncate max-w-[120px]">{ad.commercialName || `ID ${ad.commercialId}`}</span>

          {/* Date */}
          <span>{formatDate(ad.startDate)}</span>
        </div>

        {/* Rejection reason inline */}
        {ad.status === 'REJECTED' && ad.rejectionReason && (
          <p className="text-xs text-red-600 mt-1 truncate">
            <span className="font-semibold">Razón: </span>{ad.rejectionReason}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Detail button — always visible */}
        <button
          onClick={() => onViewDetail(ad)}
          title="Ver detalle completo"
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <Info className="w-4 h-4" />
        </button>

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

// ── Action buttons per status ─────────────────────────────────────────────────

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

const btn = {
  green: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  red:   'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  amber: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
};

const AdCardActions: React.FC<AdCardActionsProps> = ({
  ad, onApprove, onReject, onPause, onResume, onBlock, isLoading,
}) => {
  switch (ad.status) {
    case 'PENDING':
      return (
        <>
          <button onClick={() => onApprove(ad.id)} disabled={isLoading.approve} className={btn.green}>
            <CheckCircle className="w-3.5 h-3.5" /> Aprobar
          </button>
          <button onClick={() => onReject(ad)} disabled={isLoading.reject} className={btn.red}>
            <XCircle className="w-3.5 h-3.5" /> Rechazar
          </button>
        </>
      );
    case 'APPROVED':
      return (
        <>
          <button onClick={() => onResume(ad.id)} disabled={isLoading.resume} className={btn.green}>
            <Play className="w-3.5 h-3.5" /> Activar
          </button>
          <button onClick={() => onBlock(ad)} disabled={isLoading.block} className={btn.red}>
            <Ban className="w-3.5 h-3.5" /> Bloquear
          </button>
        </>
      );
    case 'ACTIVE':
      return (
        <>
          <button onClick={() => onPause(ad.id)} disabled={isLoading.pause} className={btn.amber}>
            <Pause className="w-3.5 h-3.5" /> Pausar
          </button>
          <button onClick={() => onBlock(ad)} disabled={isLoading.block} className={btn.red}>
            <Ban className="w-3.5 h-3.5" /> Bloquear
          </button>
        </>
      );
    case 'PAUSED':
      return (
        <>
          <button onClick={() => onResume(ad.id)} disabled={isLoading.resume} className={btn.green}>
            <Play className="w-3.5 h-3.5" /> Reanudar
          </button>
          <button onClick={() => onBlock(ad)} disabled={isLoading.block} className={btn.red}>
            <Ban className="w-3.5 h-3.5" /> Bloquear
          </button>
        </>
      );
    case 'BLOCKED':
      return (
        <>
          <button onClick={() => onResume(ad.id)} disabled={isLoading.resume} className={btn.green}>
            <Play className="w-3.5 h-3.5" /> Reanudar
          </button>
          <button onClick={() => onPause(ad.id)} disabled={isLoading.pause} className={btn.amber}>
            <Pause className="w-3.5 h-3.5" /> Pausar
          </button>
        </>
      );
    default:
      return null;
  }
};
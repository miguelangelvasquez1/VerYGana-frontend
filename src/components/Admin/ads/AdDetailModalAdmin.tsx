import React from 'react';
import {
  X, Video, Image as ImageIcon, Calendar, Target,
  Users, DollarSign, Heart, MapPin, Tag, Link as LinkIcon,
  TrendingUp, Clock,
} from 'lucide-react';
import { AdForAdminDTO } from '@/types/ads/commercial';
import { AD_STATUS_STYLES, AD_STATUS_LABELS } from './utils/adConstants';
import { formatCurrency, formatDate } from './utils/adHelper';

interface AdDetailModalProps {
  ad: AdForAdminDTO;
  onClose: () => void;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({ ad, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{ad.title}</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${AD_STATUS_STYLES[ad.status as keyof typeof AD_STATUS_STYLES]}`}>
              {AD_STATUS_LABELS[ad.status as keyof typeof AD_STATUS_LABELS]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Media */}
          <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            {ad.contentUrl ? (
              ad.mediaType === 'VIDEO' ? (
                <video
                  src={ad.contentUrl}
                  controls
                  className="w-full max-h-80 object-contain bg-black"
                />
              ) : (
                <img
                  src={ad.contentUrl}
                  alt={ad.title}
                  className="w-full max-h-80 object-contain"
                />
              )
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-300 gap-2">
                {ad.mediaType === 'VIDEO'
                  ? <Video className="w-10 h-10" />
                  : <ImageIcon className="w-10 h-10" />}
                <span className="text-sm">Sin contenido disponible</span>
              </div>
            )}
          </div>

          {/* Media type + target URL */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              {ad.mediaType === 'VIDEO' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              {ad.mediaType === 'VIDEO' ? 'Video' : 'Imagen'}
            </span>
            {ad.targetUrl && (
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:underline truncate"
              >
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{ad.targetUrl}</span>
              </a>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{ad.description}</p>
          </div>

          {/* Rejection reason */}
          {ad.status === 'REJECTED' && ad.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Razón de rechazo</h4>
              <p className="text-sm text-red-800">{ad.rejectionReason}</p>
            </div>
          )}

          {/* Budget & performance */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Presupuesto y rendimiento</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: 'Presupuesto total', value: formatCurrency(ad.totalBudget), color: 'text-gray-700' },
                { icon: TrendingUp, label: 'Gastado', value: formatCurrency(ad.spentBudget), color: 'text-blue-600' },
                { icon: DollarSign, label: 'Restante', value: formatCurrency(ad.remainingBudget), color: 'text-emerald-600' },
                { icon: Heart, label: 'Likes', value: `${ad.currentLikes} / ${ad.maxLikes}`, color: 'text-pink-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <Icon className={`w-4 h-4 ${color} mb-1`} />
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progreso de campaña</span>
                <span>{ad.completionPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(ad.completionPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Fechas</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span><span className="font-semibold">Inicio:</span> {formatDate(ad.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span><span className="font-semibold">Fin:</span> {formatDate(ad.endDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span><span className="font-semibold">Creado:</span> {formatDate(ad.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span><span className="font-semibold">Actualizado:</span> {formatDate(ad.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Audiencia objetivo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span><span className="font-semibold">Género:</span> {ad.targetGender}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span><span className="font-semibold">Edad:</span> {ad.minAge}–{ad.maxAge} años</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span><span className="font-semibold">Anunciante:</span> {ad.commercialName || `ID ${ad.commercialId}`}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          {ad.categories?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                <Tag className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Categorías
              </h4>
              <div className="flex flex-wrap gap-2">
                {ad.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Municipalities */}
          {ad.targetMunicipalities?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                <MapPin className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Municipios objetivo
              </h4>
              <div className="flex flex-wrap gap-2">
                {ad.targetMunicipalities.map((m) => (
                  <span
                    key={m.code}
                    className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full"
                  >
                    📍 {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
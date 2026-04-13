// components/ads/AdDetailModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X, Heart, DollarSign, TrendingUp, Calendar, Target,
  MapPin, Tag, User, ChevronLeft, ChevronRight, Loader2, Info
} from 'lucide-react';
import { useAdDetails } from '@/hooks/ads/querys';
import { useAdLikes } from '@/hooks/ads/querys';

interface AdDetailModalProps {
  adId: number;
  onClose: () => void;
}

export function AdDetailModal({ adId, onClose }: AdDetailModalProps) {
  const [likesPage, setLikesPage] = useState(0);

  const { data: ad, isLoading: loadingAd } = useAdDetails(adId);
  const { data: likesData, isLoading: loadingLikes } = useAdLikes(adId, likesPage);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'No definida';

  const statusColors: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-800',
    ACTIVE:    'bg-blue-100 text-blue-800',
    PAUSED:    'bg-gray-100 text-gray-700',
    COMPLETED: 'bg-purple-100 text-purple-800',
    REJECTED:  'bg-red-100 text-red-800',
    EXPIRED:   'bg-gray-200 text-gray-600',
    BLOCKED:   'bg-gray-200 text-gray-600',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente', ACTIVE: 'Activo', PAUSED: 'Pausado',
    COMPLETED: 'Completado', REJECTED: 'Rechazado',
    EXPIRED: 'Expirado', BLOCKED: 'Bloqueado',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Detalle del anuncio</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 cursor-pointer" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingAd ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : ad ? (
            <div className="p-5 space-y-5">

              {/* Media preview */}
              {ad.contentUrl && (
                <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100">
                  {ad.mediaType === 'VIDEO' ? (
                    <video src={ad.contentUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={ad.contentUrl} alt={ad.title} className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Título y estado */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {ad.id} · Creado: {formatDate(ad.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColors[ad.status]}`}>
                  {statusLabels[ad.status]}
                </span>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{ad.description}</p>

              {/* Rechazo */}
              {ad.status === 'REJECTED' && ad.rejectionReason && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-red-800">
                  <strong className="block mb-1">Motivo del rechazo:</strong>
                  {ad.rejectionReason}
                </div>
              )}

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Heart className="w-4 h-4 text-pink-500" />,   label: 'Likes',    value: `${ad.currentLikes}/${ad.maxLikes}` },
                  { icon: <DollarSign className="w-4 h-4 text-red-400" />, label: 'Invertido', value: `$${ad.spentBudget.toFixed(2)}` },
                  { icon: <TrendingUp className="w-4 h-4 text-blue-500" />, label: 'Restante',  value: `$${ad.remainingBudget.toFixed(2)}` },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="flex justify-center mb-1">{m.icon}</div>
                    <p className="text-sm font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Progreso */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                  <span>Progreso</span>
                  <span className="font-bold">{ad.completionPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(ad.completionPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Presupuesto */}
              <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recompensa / like</p>
                  <p className="font-bold text-gray-900">${ad.rewardPerLike.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Presupuesto total</p>
                  <p className="font-bold text-gray-900">${ad.totalBudget.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Máx. likes</p>
                  <p className="font-bold text-gray-900">{ad.maxLikes}</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Inicio',       value: formatDate(ad.startDate) },
                  { label: 'Finalización', value: formatDate(ad.endDate)   },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className="font-medium text-gray-800">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audiencia */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Audiencia objetivo
                </p>
                <p className="text-gray-600">
                  <span className="text-gray-400">Género:</span>{' '}
                  <strong>
                    {ad.targetGender === 'ALL' ? 'Todos'
                      : ad.targetGender === 'MALE' ? 'Masculino' : 'Femenino'}
                  </strong>
                </p>
                <p className="text-gray-600">
                  <span className="text-gray-400">Edad:</span>{' '}
                  <strong>{ad.minAge} – {ad.maxAge} años</strong>
                </p>
                {ad.targetMunicipalities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    {ad.targetMunicipalities.map((m: any) => (
                      <span key={m.code} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {m.name}, {m.departmentName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Categorías */}
              {ad.categories.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" /> Categorías
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ad.categories.map((c: any) => (
                      <span key={c.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* URL destino */}
              {ad.targetUrl && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg text-sm text-purple-700 overflow-hidden">
                  <span className="shrink-0">🔗</span>
                  <a href={ad.targetUrl} target="_blank" rel="noreferrer"
                    className="truncate hover:underline">{ad.targetUrl}</a>
                </div>
              )}

              {/* Likes paginados */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Personas que dieron like
                  {likesData && (
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({likesData.meta.totalElements} total)
                    </span>
                  )}
                </p>

                {loadingLikes ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                ) : likesData && likesData.data.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                      {likesData.data.map((like:any, i:any) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                              {like.userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{like.userName}</span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(like.likedAt)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Paginación */}
                    {likesData.meta.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <button
                          onClick={() => setLikesPage(p => Math.max(0, p - 1))}
                          disabled={likesPage === 0}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span className="text-gray-400 text-xs">
                          Página {likesPage + 1} de {likesData.meta.totalPages}
                        </span>
                        <button
                          onClick={() => setLikesPage(p => Math.min(likesData.meta.totalPages - 1, p + 1))}
                          disabled={likesPage >= likesData.meta.totalPages - 1}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aún no hay likes en este anuncio</p>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
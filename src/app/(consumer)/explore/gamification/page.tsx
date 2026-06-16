'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Zap, Trophy, Star, Diamond, Medal, Crown,
  ChevronRight, ChevronLeft, Clock, TrendingUp,
  AlertCircle, Target, Users, ShoppingBag,
  Gamepad2, ClipboardList, Tv2,
} from 'lucide-react'
import type { LevelProfile, TransactionLog, LevelConfig, PagedResponse } from '@/types/level'
import { levelService } from '@/services/LevelService'

// ─── Configuración visual por nivel ──────────────────────────────────────────

const LEVEL_CONFIG = {
  BRONCE:    { label: 'Bronce',    from: '#b45309', to: '#d97706', bg: 'from-amber-600 to-amber-500',    badge: 'bg-amber-100 text-amber-800',    bar: 'bg-amber-500',    Icon: Medal   },
  PLATA:     { label: 'Plata',     from: '#6b7280', to: '#9ca3af', bg: 'from-gray-500 to-gray-400',      badge: 'bg-gray-100 text-gray-700',      bar: 'bg-gray-500',     Icon: Star    },
  ORO:       { label: 'Oro',       from: '#b45309', to: '#fbbf24', bg: 'from-yellow-600 to-yellow-400',  badge: 'bg-yellow-100 text-yellow-800',  bar: 'bg-yellow-500',   Icon: Trophy  },
  RUBI:      { label: 'Rubí',      from: '#be123c', to: '#f43f5e', bg: 'from-rose-700 to-rose-500',      badge: 'bg-rose-100 text-rose-800',      bar: 'bg-rose-500',     Icon: Zap     },
  ESMERALDA: { label: 'Esmeralda', from: '#065f46', to: '#10b981', bg: 'from-emerald-700 to-emerald-500',badge: 'bg-emerald-100 text-emerald-800',bar: 'bg-emerald-500',  Icon: Diamond },
  DIAMANTE:  { label: 'Diamante',  from: '#1d4ed8', to: '#60a5fa', bg: 'from-blue-700 to-blue-400',      badge: 'bg-blue-100 text-blue-800',      bar: 'bg-blue-500',     Icon: Crown   },
} as const

const ACTIVITY_CONFIG = {
  SURVEY_COMPLETED: { label: 'Encuesta completada', Icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50' },
  VIDEO_WATCHED:    { label: 'Video visto',          Icon: Tv2,           color: 'text-blue-500',   bg: 'bg-blue-50'   },
  GAME_PLAYED:      { label: 'Partida jugada',       Icon: Gamepad2,      color: 'text-green-500',  bg: 'bg-green-50'  },
  REFERRAL_ACTIVE:  { label: 'Referido activo',      Icon: Users,         color: 'text-amber-500',  bg: 'bg-amber-50'  },
  PURCHASE:         { label: 'Compra realizada',     Icon: ShoppingBag,   color: 'text-rose-500',   bg: 'bg-rose-50'   },
}

const LEVEL_ORDER = ['BRONCE', 'PLATA', 'ORO', 'RUBI', 'ESMERALDA', 'DIAMANTE']

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'perfil' | 'historial' | 'niveles'

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GamificationPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined

  const [tab, setTab] = useState<Tab>('perfil')
  const [profile, setProfile] = useState<LevelProfile | null>(null)
  const [history, setHistory] = useState<PagedResponse<TransactionLog> | null>(null)
  const [config, setConfig] = useState<LevelConfig[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([
      levelService.getProfile(token),
      levelService.getConfig(token),
    ]).then(([p, c]) => {
      setProfile(p)
      setConfig(c)
    }).finally(() => setLoading(false))
  }, [token])

  const loadHistory = useCallback((p: number) => {
    if (!token) return
    setHistLoading(true)
    levelService.getHistory(token, p).then(setHistory).finally(() => setHistLoading(false))
  }, [token])

  useEffect(() => {
    if (tab === 'historial') loadHistory(page)
  }, [tab, page, loadHistory])

  const lv = profile ? LEVEL_CONFIG[profile.currentLevel] : LEVEL_CONFIG.BRONCE
  const LvIcon = lv.Icon
  const xpMax = profile ? profile.xpTotal + profile.xpToNextLevel : 1000
  const pct = profile ? Math.min((profile.xpTotal / xpMax) * 100, 100) : 0
  const lvIndex = profile ? LEVEL_ORDER.indexOf(profile.currentLevel) : 0
  const nextLevel = lvIndex < 5 ? LEVEL_ORDER[lvIndex + 1] : null
  const nextLvConfig = nextLevel ? LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

      {/* ── Header hero ─────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${lv.bg} px-4 pt-6 pb-20 lg:px-8 lg:pt-10 lg:pb-24`}>
        <div className="max-w-2xl mx-auto text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-48 h-4" />
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur mb-3">
                <LvIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">{lv.label}</h1>
              <p className="text-white/70 text-sm mt-1">
                Multiplicador <span className="font-bold text-white">×{profile?.multiplier.toFixed(1)}</span> en todas tus actividades
              </p>

              {/* barra xp */}
              <div className="mt-5 mx-auto max-w-xs">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>{profile?.xpTotal.toLocaleString('es-CO')} XP</span>
                  <span>{xpMax.toLocaleString('es-CO')} XP</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {nextLvConfig && (
                  <p className="text-white/60 text-xs mt-1.5">
                    {profile?.xpToNextLevel.toLocaleString('es-CO')} XP para <span className="text-white font-medium">{nextLvConfig.label}</span>
                  </p>
                )}
                {!nextLvConfig && (
                  <p className="text-white/80 text-xs mt-1.5 font-medium">🏆 Nivel máximo alcanzado</p>
                )}
              </div>

              {profile?.benefitsPaused && (
                <div className="mt-4 inline-flex items-center gap-2 bg-red-500/20 border border-red-300/30 rounded-full px-4 py-2">
                  <AlertCircle className="w-4 h-4 text-red-200" />
                  <span className="text-red-100 text-xs font-medium">Beneficios pausados por inactividad</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Tabs flotantes ───────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 -mt-14 lg:-mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-1">
          {(['perfil', 'historial', 'niveles'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t
                  ? `bg-gradient-to-r ${lv.bg} text-white shadow-md`
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'perfil' ? 'Mi nivel' : t === 'historial' ? 'Historial' : 'Todos los niveles'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 mt-5 space-y-4">

        {/* ── TAB: PERFIL ────────────────────────────────────────────────────── */}
        {tab === 'perfil' && (
          <>
            {/* Métricas */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24" /><Skeleton className="h-24" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-500 font-medium">XP total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{profile?.xpTotal.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-gray-500 font-medium">Multiplicador</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">×{profile?.multiplier.toFixed(1)}</p>
                </div>
              </div>
            )}

            {/* Misión de reactivación */}
            {profile?.reactivationMissionActive && profile.reactivationKeysGoal && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-800">Misión de reactivación</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Progreso</span>
                  <span className="font-semibold text-gray-700">
                    {profile.reactivationKeysProgress ?? 0} / {profile.reactivationKeysGoal} XP
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(((profile.reactivationKeysProgress ?? 0) / profile.reactivationKeysGoal) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(profile.reactivationKeysGoal - (profile.reactivationKeysProgress ?? 0)).toLocaleString()} XP restantes para restaurar beneficios
                </p>
              </div>
            )}

            {/* Cómo ganar XP */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Cómo ganar XP</h3>
              <div className="space-y-2.5">
                {Object.entries(ACTIVITY_CONFIG).map(([key, { label, Icon, color, bg }]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${lv.badge}`}>
                      ×{profile?.multiplier.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: HISTORIAL ─────────────────────────────────────────────────── */}
        {tab === 'historial' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {histLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : !history || history.content.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Clock className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">Sin actividad aún</p>
                <p className="text-xs mt-1">Completa encuestas o mira anuncios para ganar XP</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {history.content.map(tx => {
                    const act = ACTIVITY_CONFIG[tx.activityType] ?? {
                      label: tx.activityType, Icon: Zap, color: 'text-gray-500', bg: 'bg-gray-50',
                    }
                    const ActIcon = act.Icon
                    const date = new Date(tx.createdAt)
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className={`w-10 h-10 rounded-xl ${act.bg} flex items-center justify-center shrink-0`}>
                          <ActIcon className={`w-5 h-5 ${act.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{act.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}×{tx.multiplierApplied.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-purple-600">+{tx.xpEarned} XP</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Paginación */}
                {history.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => { setPage(p => p - 1) }}
                      disabled={page === 0}
                      className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-gray-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="text-xs text-gray-400">
                      {page + 1} / {history.totalPages}
                    </span>
                    <button
                      onClick={() => { setPage(p => p + 1) }}
                      disabled={history.last}
                      className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-gray-800 transition-colors"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: NIVELES ───────────────────────────────────────────────────── */}
        {tab === 'niveles' && (
          <div className="space-y-3">
            {config.length === 0 ? (
              <div className="space-y-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              config.map(lc => {
                const lvCfg = LEVEL_CONFIG[lc.level as keyof typeof LEVEL_CONFIG]
                if (!lvCfg) return null
                const LcIcon = lvCfg.Icon
                const isCurrent = profile?.currentLevel === lc.level
                const isUnlocked = lvIndex >= LEVEL_ORDER.indexOf(lc.level)

                return (
                  <div
                    key={lc.level}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                      isCurrent ? 'border-2 border-purple-400 shadow-purple-100' : 'border-gray-100'
                    } ${!isUnlocked ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${lvCfg.bg} flex items-center justify-center`}>
                        <LcIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{lvCfg.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Tu nivel
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {lc.xpMin.toLocaleString()} — {typeof lc.xpMax === 'number' ? lc.xpMax.toLocaleString() : lc.xpMax} XP
                        </span>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${lvCfg.badge}`}>
                        ×{lc.multiplier.toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Llaves referido</p>
                        <p className="text-sm font-bold text-gray-700">{lc.referralKeys}</p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-xs text-gray-400">Tickets referido</p>
                        <p className="text-sm font-bold text-gray-700">{lc.referralTickets}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Tickets rifa</p>
                        <p className="text-sm font-bold text-gray-700">{lc.raffleTickets}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
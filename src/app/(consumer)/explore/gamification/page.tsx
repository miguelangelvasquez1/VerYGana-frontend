'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import {
  Zap, Trophy, Star, Diamond, Medal, Crown,
  ChevronRight, ChevronLeft, Clock, TrendingUp,
  AlertCircle, Target, Users, ShoppingBag,
  Gamepad2, ClipboardList, Tv2, ArrowRight,
} from 'lucide-react'
import type { LevelProfile, TransactionLog, LevelConfig, PagedResponse } from '@/types/level'
import { levelService } from '@/services/LevelService'
import {
  BRAND, LEVEL_ORDER, levelTheme, levelGradient, levelSheen, activityTheme, MEDALLION_BEVEL,
} from '@/components/levels/levelTheme'

// ─── Íconos por nivel / actividad (colores viven en levelTheme) ───────────────

const LEVEL_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  BRONCE: Medal, PLATA: Star, ORO: Trophy, RUBI: Zap, ESMERALDA: Diamond, DIAMANTE: Crown,
}

const ACTIVITY_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  SURVEY_COMPLETED: ClipboardList,
  VIDEO_WATCHED:    Tv2,
  GAME_PLAYED:      Gamepad2,
  REFERRAL_ACTIVE:  Users,
  PURCHASE:         ShoppingBag,
}

// ─── Tokens de animación (curvas fuertes, duraciones cortas) ──────────────────

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const TAB_SPRING = { type: 'spring' as const, duration: 0.5, bounce: 0.18 }

// Contenedor con entrada escalonada de sus hijos
const listV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
}
const itemV: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

// Skeleton para superficies de color (hero)
function SkeletonOnDark({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/20 rounded-xl ${className}`} />
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

  const reduce = useReducedMotion()
  const currentLevel = profile?.currentLevel ?? 'BRONCE'
  const lv = levelTheme(currentLevel)
  const LvIcon = LEVEL_ICON[currentLevel] ?? Medal
  const xpMax = profile ? profile.xpTotal + profile.xpToNextLevel : 1000
  const pct = profile ? Math.min((profile.xpTotal / xpMax) * 100, 100) : 0
  const lvIndex = profile ? LEVEL_ORDER.indexOf(profile.currentLevel) : 0
  const nextLevel = lvIndex < 5 ? LEVEL_ORDER[lvIndex + 1] : null
  const nextLvConfig = nextLevel ? levelTheme(nextLevel) : null

  // Métricas de la columna derecha del hero
  const heroStats = [
    { label: 'XP total',      value: profile?.xpTotal.toLocaleString('es-CO') ?? '—', icon: TrendingUp },
    { label: 'Multiplicador', value: `×${profile?.multiplier.toFixed(1) ?? '1.0'}`,   icon: Zap },
    {
      label: nextLvConfig ? 'XP al siguiente' : 'Progreso',
      value: nextLvConfig ? (profile?.xpToNextLevel.toLocaleString('es-CO') ?? '—') : 'Máximo',
      icon: Target,
    },
    {
      label: nextLvConfig ? 'Siguiente nivel' : 'Nivel actual',
      value: nextLvConfig ? nextLvConfig.label : lv.label,
      icon: Trophy,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: levelSheen(currentLevel) }}>
        {/* círculos decorativos */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-white/10" />
        {/* viñeta suave para dar profundidad al metal */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.16), transparent 60%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Columna izquierda — copy */}
            <motion.div
              className="flex-1 w-full text-white"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            >
              {loading ? (
                <div className="space-y-4">
                  <SkeletonOnDark className="w-40 h-7 rounded-full" />
                  <SkeletonOnDark className="w-64 h-14" />
                  <SkeletonOnDark className="w-full max-w-xl h-5" />
                  <SkeletonOnDark className="w-full max-w-md h-10 rounded-2xl" />
                </div>
              ) : (
                <>
                  {/* pill superior */}
                  <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                    <LvIcon className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                    Tu nivel actual
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5">
                    <span className="text-white/70">Nivel</span><br />
                    {lv.label}
                  </h1>

                  <p className="text-white/75 text-base lg:text-lg leading-relaxed max-w-xl mb-8">
                    Multiplicador{' '}
                    <span className="font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ×{profile?.multiplier.toFixed(1)}
                    </span>{' '}
                    en todas tus actividades. Acumula XP para desbloquear más beneficios.
                  </p>

                  {/* barra xp */}
                  <div className="max-w-md mb-8">
                    <div className="flex justify-between text-xs text-white/70 mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <span>{profile?.xpTotal.toLocaleString('es-CO')} XP</span>
                      <span>{xpMax.toLocaleString('es-CO')} XP</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {nextLvConfig ? (
                      <p className="text-white/60 text-xs mt-1.5">
                        {profile?.xpToNextLevel.toLocaleString('es-CO')} XP para <span className="text-white font-medium">{nextLvConfig.label}</span>
                      </p>
                    ) : (
                      <p className="text-white/80 text-xs mt-1.5 font-medium">🏆 Nivel máximo alcanzado</p>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setTab('niveles')}
                      className="flex items-center gap-2 bg-white hover:brightness-105 font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                      style={{ color: lv.on }}
                    >
                      Ver todos los niveles
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTab('historial')}
                      className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-full transition-all cursor-pointer"
                    >
                      Ver mi historial
                    </button>
                  </div>

                  {profile?.benefitsPaused && (
                    <div className="mt-6 inline-flex items-center gap-2 bg-red-500/20 border border-red-300/30 rounded-full px-4 py-2">
                      <AlertCircle className="w-4 h-4 text-red-200" />
                      <span className="text-red-100 text-xs font-medium">Beneficios pausados por inactividad</span>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Columna derecha — tarjetas de métricas */}
            <motion.div
              className="shrink-0 w-full lg:w-80"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT }}
            >
              <div className="grid grid-cols-2 gap-3">
                {heroStats.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white"
                  >
                    <div className="flex items-center gap-2 text-white/70 mb-2">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <div className="text-2xl font-extrabold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {loading ? '—' : value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* onda inferior */}
        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block w-full" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-1">
          {(['perfil', 'historial', 'niveles'] as Tab[]).map(t => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className={`relative flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors duration-200 ${
                tab === t ? 'text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === t && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl shadow-md"
                  style={{ background: levelGradient(currentLevel, 90) }}
                  transition={reduce ? { duration: 0 } : TAB_SPRING}
                />
              )}
              <span className="relative z-10">
                {t === 'perfil' ? 'Mi nivel' : t === 'historial' ? 'Historial' : 'Todos los niveles'}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 mt-5">
        <AnimatePresence mode="wait">

        {/* ── TAB: PERFIL ────────────────────────────────────────────────────── */}
        {tab === 'perfil' && (
          <motion.div
            key="perfil"
            className="space-y-4"
            variants={listV}
            initial={reduce ? false : 'hidden'}
            animate="show"
            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
          >
            {/* Métricas */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24" /><Skeleton className="h-24" />
              </div>
            ) : (
              <motion.div variants={itemV} className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: BRAND.azulClaro }} />
                    <span className="text-[11px] text-gray-500 font-semibold uppercase" style={{ letterSpacing: '0.1em' }}>XP total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{profile?.xpTotal.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" style={{ color: BRAND.azulMedianoche }} />
                    <span className="text-[11px] text-gray-500 font-semibold uppercase" style={{ letterSpacing: '0.1em' }}>Multiplicador</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: BRAND.azulMedianoche, fontVariantNumeric: 'tabular-nums' }}>×{profile?.multiplier.toFixed(1)}</p>
                </div>
              </motion.div>
            )}

            {/* Misión de reactivación */}
            {profile?.reactivationMissionActive && profile.reactivationXpGoal && (
              <motion.div variants={itemV} className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${BRAND.azulClaro}33` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5" style={{ color: BRAND.azulMedianoche }} />
                  <span className="font-semibold text-gray-800">Misión de reactivación</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Progreso</span>
                  <span className="font-semibold text-gray-700">
                    {profile.reactivationXpProgress ?? 0} / {profile.reactivationXpGoal} XP
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(((profile.reactivationXpProgress ?? 0) / profile.reactivationXpGoal) * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${BRAND.azulClaroDark}, ${BRAND.azulClaro})`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(profile.reactivationXpGoal - (profile.reactivationXpProgress ?? 0)).toLocaleString()} XP restantes para restaurar beneficios
                </p>
              </motion.div>
            )}

            {/* Cómo ganar XP */}
            <motion.div variants={itemV} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Cómo ganar XP</h3>
              <div className="space-y-2.5">
                {Object.keys(ACTIVITY_ICON).map(key => {
                  const act = activityTheme(key)
                  const Icon = ACTIVITY_ICON[key]
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: lv.soft }}>
                          <Icon className="w-4 h-4" style={{ color: lv.accent }} />
                        </div>
                        <span className="text-sm text-gray-700">{act.label}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: lv.soft, color: lv.on }}>
                        ×{profile?.multiplier.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── TAB: HISTORIAL ─────────────────────────────────────────────────── */}
        {tab === 'historial' && (
          <motion.div
            key="historial"
            variants={itemV}
            initial={reduce ? false : 'hidden'}
            animate="show"
            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
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
                    const act = activityTheme(tx.activityType)
                    const ActIcon = ACTIVITY_ICON[tx.activityType] ?? Zap
                    const date = new Date(tx.createdAt)
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: act.bg }}>
                          <ActIcon className="w-5 h-5" style={{ color: act.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{act.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}×{tx.multiplierApplied.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold" style={{ color: BRAND.dorado }}>+{tx.xpEarned} XP</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Paginación */}
                {history.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <motion.button
                      onClick={() => { setPage(p => p - 1) }}
                      disabled={page === 0}
                      whileTap={reduce ? undefined : { scale: 0.95 }}
                      className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-gray-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </motion.button>
                    <span className="text-xs text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {page + 1} / {history.totalPages}
                    </span>
                    <motion.button
                      onClick={() => { setPage(p => p + 1) }}
                      disabled={history.last}
                      whileTap={reduce ? undefined : { scale: 0.95 }}
                      className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-gray-800 transition-colors"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── TAB: NIVELES ───────────────────────────────────────────────────── */}
        {tab === 'niveles' && (
          <motion.div
            key="niveles"
            className="space-y-3"
            variants={listV}
            initial={reduce ? false : 'hidden'}
            animate="show"
            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
          >
            {config.length === 0 ? (
              <div className="space-y-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              config.map(lc => {
                const lvCfg = levelTheme(lc.level)
                const LcIcon = LEVEL_ICON[lc.level]
                if (!LcIcon) return null
                const isCurrent = profile?.currentLevel === lc.level
                const isUnlocked = lvIndex >= LEVEL_ORDER.indexOf(lc.level as typeof LEVEL_ORDER[number])

                return (
                  <motion.div
                    key={lc.level}
                    variants={itemV}
                    whileHover={reduce ? undefined : { y: -3 }}
                    whileTap={reduce ? undefined : { scale: 0.99 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className={`bg-white rounded-2xl p-4 shadow-sm ${!isUnlocked ? 'opacity-60' : ''}`}
                    style={{
                      border: isCurrent ? `2px solid ${lvCfg.accent}` : '1px solid #f3f4f6',
                      boxShadow: isCurrent ? `0 8px 24px ${lvCfg.accent}22` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: levelSheen(lc.level), boxShadow: `${MEDALLION_BEVEL}, 0 6px 14px ${lvCfg.accent}2E` }}>
                        <LcIcon className="w-6 h-6" style={{ color: lvCfg.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{lvCfg.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: lvCfg.soft, color: lvCfg.on, letterSpacing: '0.08em' }}>
                              Tu nivel
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {lc.xpMin.toLocaleString()} — {typeof lc.xpMax === 'number' ? lc.xpMax.toLocaleString() : lc.xpMax} XP
                        </span>
                      </div>
                      <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: lvCfg.soft, color: lvCfg.on, fontVariantNumeric: 'tabular-nums' }}>
                        ×{lc.multiplier.toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                      <div className="text-center">
                        <p className="text-[11px] text-gray-400 uppercase" style={{ letterSpacing: '0.1em' }}>Tickets referido</p>
                        <p className="text-sm font-bold text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{lc.referralTickets}</p>
                      </div>
                      <div className="text-center border-l border-gray-100">
                        <p className="text-[11px] text-gray-400 uppercase" style={{ letterSpacing: '0.1em' }}>Tickets rifa</p>
                        <p className="text-sm font-bold text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{lc.raffleTickets}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
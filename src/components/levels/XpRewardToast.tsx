'use client'

import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp, ClipboardList, Tv2, Gamepad2,
  Users, ShoppingBag, Medal, Star, Trophy, Crown, Diamond,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XpRewardData {
  activityType: 'SURVEY_COMPLETED' | 'VIDEO_WATCHED' | 'GAME_PLAYED' | 'REFERRAL_ACTIVE' | 'PURCHASE'
  xpEarned: number
  multiplier: number
  currentLevel: string
  xpTotal: number
  xpToNextLevel: number
  leveledUp?: boolean
  newLevel?: string
}

interface Props {
  data: XpRewardData | null
  onDismiss: () => void
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTIVITY_CONFIG = {
  SURVEY_COMPLETED: { label: 'Encuesta completada', Icon: ClipboardList, color: '#7c3aed', bg: '#ede9fe' },
  VIDEO_WATCHED:    { label: 'Video visto',          Icon: Tv2,           color: '#1d4ed8', bg: '#dbeafe' },
  GAME_PLAYED:      { label: 'Partida jugada',       Icon: Gamepad2,      color: '#15803d', bg: '#dcfce7' },
  REFERRAL_ACTIVE:  { label: 'Referido activo',      Icon: Users,         color: '#b45309', bg: '#fef3c7' },
  PURCHASE:         { label: 'Compra realizada',     Icon: ShoppingBag,   color: '#be123c', bg: '#ffe4e6' },
} as const

const LEVEL_CONFIG: Record<string, { bar: string; label: string; Icon: React.ComponentType<{ style?: React.CSSProperties }> }> = {
  BRONCE:    { bar: '#d97706', label: 'Bronce',    Icon: Medal   },
  PLATA:     { bar: '#9ca3af', label: 'Plata',     Icon: Star    },
  ORO:       { bar: '#fbbf24', label: 'Oro',       Icon: Trophy  },
  RUBI:      { bar: '#f43f5e', label: 'Rubí',      Icon: Diamond },
  ESMERALDA: { bar: '#10b981', label: 'Esmeralda', Icon: Star    },
  DIAMANTE:  { bar: '#60a5fa', label: 'Diamante',  Icon: Crown   },
}

// ─── Hook: contador animado ───────────────────────────────────────────────────

function useCountUp(target: number, duration: number, trigger: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (trigger === 0) return
    setCount(0)
    let startTime: number | null = null
    let rafId: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3 // ease-out cúbico
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [trigger, target, duration])
  return count
}

// ─── Partículas para level-up ─────────────────────────────────────────────────

const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function LevelUpParticles({ color }: { color: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {PARTICLE_ANGLES.map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: color,
            opacity: 0,
            animation: `xp-particle-${i} 0.7s ease-out ${i * 30}ms both`,
          }}
        />
      ))}
    </div>
  )
}

// ─── CSS keyframes ────────────────────────────────────────────────────────────

const PARTICLE_CSS = PARTICLE_ANGLES.map((angle, i) => {
  const rad = (angle * Math.PI) / 180
  const tx = Math.round(Math.cos(rad) * 28)
  const ty = Math.round(Math.sin(rad) * 28)
  return `
    @keyframes xp-particle-${i} {
      0%   { opacity: 1; transform: translate(-50%, -50%) translate(0px, 0px) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(0); }
    }
  `
}).join('')

const ANIMATIONS_CSS = `
  @keyframes xp-toast-in {
    from { opacity: 0; transform: scale(0.88) translateY(12px); }
    60%  { transform: scale(1.03) translateY(-2px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes xp-icon-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    65%  { transform: scale(1.18); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes xp-pulse-ring {
    0%   { transform: scale(0.85); opacity: 0.7; }
    100% { transform: scale(1.7);  opacity: 0;   }
  }
  @keyframes xp-amount-in {
    0%   { transform: scale(0.6) translateY(6px); opacity: 0; }
    65%  { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes xp-float-label {
    0%   { opacity: 1; transform: translate(-50%, 0)  scale(1); }
    100% { opacity: 0; transform: translate(-50%, -20px) scale(0.75); }
  }
  @keyframes xp-levelup-in {
    from { opacity: 0; transform: scale(0.88) translateY(-8px); }
    60%  { transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes xp-shimmer {
    0%   { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%)  skewX(-12deg); }
  }
  ${PARTICLE_CSS}
`

// ─── Componente ───────────────────────────────────────────────────────────────

export function XpRewardToast({ data, onDismiss }: Props) {
  const [visible, setVisible]       = useState(false)
  const [barTarget, setBarTarget]   = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [animKey, setAnimKey]       = useState(0)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const xpDisplayed = useCountUp(data?.xpEarned ?? 0, 700, animKey)

  useEffect(() => {
    if (!data) return

    const xpMax   = data.xpTotal + data.xpToNextLevel
    const prevXp  = data.xpTotal - data.xpEarned
    const fromPct = xpMax > 0 ? Math.min((prevXp / xpMax) * 100, 100) : 0
    const toPct   = xpMax > 0 ? Math.min((data.xpTotal / xpMax) * 100, 100) : 0

    setAnimKey(k => k + 1)
    setBarTarget(fromPct)
    setShowLevelUp(false)
    setVisible(true)

    const barTimer = setTimeout(() => setBarTarget(toPct), 300)
    const lvlTimer = data.leveledUp ? setTimeout(() => setShowLevelUp(true), 800) : null

    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 400)
    }, 5000)

    return () => {
      clearTimeout(barTimer)
      if (lvlTimer) clearTimeout(lvlTimer)
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null

  const act     = ACTIVITY_CONFIG[data.activityType] ?? ACTIVITY_CONFIG.SURVEY_COMPLETED
  const lv      = LEVEL_CONFIG[data.currentLevel]    ?? LEVEL_CONFIG.BRONCE
  const ActIcon = act.Icon
  const newLv   = data.newLevel ? (LEVEL_CONFIG[data.newLevel] ?? LEVEL_CONFIG.BRONCE) : null

  return (
    <>
      <style>{ANIMATIONS_CSS}</style>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position:      'fixed',
          bottom:        'calc(env(safe-area-inset-bottom, 0px) + 76px)',
          left:          '50%',
          zIndex:        9999,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          width:         'min(360px, calc(100vw - 24px))',
          pointerEvents: 'none',
          transform:     `translateX(-50%) translateY(${visible ? '0px' : '20px'})`,
          opacity:       visible ? 1 : 0,
          transition:    'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* ── Tarjeta principal XP ─────────────────────────────────────── */}
        <div
          key={animKey}
          style={{
            width:        '100%',
            background:   'white',
            border:       '0.5px solid rgba(0,0,0,0.08)',
            borderRadius: 18,
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            boxShadow:    '0 8px 40px rgba(0,0,0,0.13)',
            animation:    'xp-toast-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Ícono de actividad */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width:       44,
              height:      44,
              borderRadius: '50%',
              background:  act.bg,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              animation:   'xp-icon-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.08s both',
            }}>
              <ActIcon style={{ width: 20, height: 20, color: act.color }} />
            </div>

            {/* Anillo de pulso */}
            <div style={{
              position:  'absolute',
              inset:     0,
              borderRadius: '50%',
              border:    `2px solid ${act.color}`,
              animation: 'xp-pulse-ring 0.7s ease-out 0.12s both',
              opacity:   0,
            }} />

            {/* Etiqueta flotante "+XP" */}
            <span style={{
              position:   'absolute',
              bottom:     '100%',
              left:       '50%',
              fontSize:   10,
              fontWeight: 700,
              color:      act.color,
              background: act.bg,
              padding:    '1px 5px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              animation:  'xp-float-label 0.9s ease-out 0.15s both',
              pointerEvents: 'none',
            }}>
              +XP
            </span>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {act.label}
              </span>
              <span style={{
                fontSize:  15,
                fontWeight: 700,
                color:     act.color,
                marginLeft: 8,
                flexShrink: 0,
                display:   'inline-block',
                animation: 'xp-amount-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.18s both',
              }}>
                +{xpDisplayed} XP
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              {lv.label} · ×{data.multiplier.toFixed(1)}
            </div>

            {/* Barra de progreso */}
            <div style={{ height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height:     '100%',
                width:      `${barTarget}%`,
                background: lv.bar,
                borderRadius: 99,
                transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {data.xpTotal.toLocaleString('es-CO')} XP
              </span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {data.currentLevel === 'DIAMANTE'
                  ? 'Nivel máximo'
                  : `${data.xpToNextLevel.toLocaleString('es-CO')} para el siguiente`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tarjeta level-up ─────────────────────────────────────────── */}
        {showLevelUp && data.leveledUp && data.newLevel && newLv && (
          <div
            key={`lvl-${animKey}`}
            style={{
              position:     'relative',
              width:        '100%',
              background:   'white',
              border:       `2px solid ${newLv.bar}`,
              borderRadius: 18,
              padding:      '12px 16px',
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              boxShadow:    `0 8px 40px ${newLv.bar}44`,
              overflow:     'hidden',
              animation:    'xp-levelup-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Shimmer sweep */}
            <div style={{
              position:   'absolute',
              top:        0,
              left:       0,
              width:      '60%',
              height:     '100%',
              background: `linear-gradient(90deg, transparent 0%, ${newLv.bar}30 50%, transparent 100%)`,
              animation:  'xp-shimmer 1.2s ease-in-out 0.1s both',
              pointerEvents: 'none',
            }} />

            {/* Partículas */}
            <LevelUpParticles color={newLv.bar} />

            <TrendingUp style={{ width: 18, height: 18, color: newLv.bar, flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>¡Subiste de nivel! </span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {LEVEL_CONFIG[data.currentLevel]?.label} →{' '}
                <span style={{ fontWeight: 700, color: newLv.bar }}>{newLv.label}</span>
              </span>
            </div>

            <newLv.Icon style={{ width: 26, height: 26, color: newLv.bar, flexShrink: 0 }} />
          </div>
        )}
      </div>
    </>
  )
}

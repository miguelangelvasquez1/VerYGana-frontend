'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingUp, ClipboardList, Tv2, Gamepad2,
  Users, ShoppingBag, Medal, Star, Trophy, Crown, Diamond,
} from 'lucide-react'
import { BRAND, levelTheme, activityTheme, levelSheen, MEDALLION_BEVEL } from './levelTheme'

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
// Colores y etiquetas viven en ./levelTheme (paleta de marca). Aquí sólo
// asociamos cada actividad/nivel con su ícono lucide.

const ACTIVITY_ICON: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  SURVEY_COMPLETED: ClipboardList,
  VIDEO_WATCHED:    Tv2,
  GAME_PLAYED:      Gamepad2,
  REFERRAL_ACTIVE:  Users,
  PURCHASE:         ShoppingBag,
}

const LEVEL_ICON: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  BRONCE:    Medal,
  PLATA:     Star,
  ORO:       Trophy,
  RUBI:      Diamond,
  ESMERALDA: Star,
  DIAMANTE:  Crown,
}

// ─── Hook: detectar reduced-motion (dispositivos de pocos recursos) ───────────

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ─── Hook: contador animado ───────────────────────────────────────────────────

function useCountUp(target: number, duration: number, trigger: number, skip = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (trigger === 0) return
    if (skip) { setCount(target); return }
    setCount(0)
    let startTime: number | null = null
    let rafId: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [trigger, target, duration, skip])
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
    from { transform: scale(0.9); }
    60%  { transform: scale(1.03); }
    to   { transform: scale(1); }
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
  const reduceMotion = useReducedMotion()
  const [visible, setVisible]       = useState(false)
  const [barTarget, setBarTarget]   = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [animKey, setAnimKey]       = useState(0)
  const [mounted, setMounted]       = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const xpDisplayed = useCountUp(data?.xpEarned ?? 0, 700, animKey, reduceMotion)

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

    const barTimer = reduceMotion ? null : setTimeout(() => setBarTarget(toPct), 300)
    if (reduceMotion) setBarTarget(toPct)
    const lvlTimer = (data.leveledUp && !reduceMotion) ? setTimeout(() => setShowLevelUp(true), 800) : null
    if (data.leveledUp && reduceMotion) setShowLevelUp(true)

    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    if (exitTimer.current) clearTimeout(exitTimer.current)
    dismissTimer.current = setTimeout(() => {
      setVisible(false)
      exitTimer.current = setTimeout(onDismiss, 400)
    }, 5000)

    return () => {
      if (barTimer) clearTimeout(barTimer)
      if (lvlTimer) clearTimeout(lvlTimer)
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data || !mounted) return null

  const act     = activityTheme(data.activityType)
  const lv      = levelTheme(data.currentLevel)
  const ActIcon = ACTIVITY_ICON[data.activityType] ?? ClipboardList
  const newLv   = data.newLevel ? levelTheme(data.newLevel) : null
  const NewLvIcon = data.newLevel ? (LEVEL_ICON[data.newLevel] ?? Star) : null

  // Al subir de nivel, la barra se llena al 100% y adopta el color del nuevo nivel
  const barColor = (data.leveledUp && newLv && showLevelUp) ? newLv.accent : lv.accent

  return createPortal(
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
          transition:    'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
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
            animation:    reduceMotion ? undefined : 'xp-toast-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
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
              animation:   reduceMotion ? undefined : 'xp-icon-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.08s both',
            }}>
              <ActIcon style={{ width: 20, height: 20, color: act.color }} />
            </div>

            {/* Anillo de pulso — omitido en reduced-motion */}
            {!reduceMotion && (
              <div style={{
                position:  'absolute',
                inset:     0,
                borderRadius: '50%',
                border:    `2px solid ${act.color}`,
                animation: 'xp-pulse-ring 0.7s ease-out 0.12s both',
                opacity:   0,
              }} />
            )}

            {/* Etiqueta flotante "+XP" — omitida en reduced-motion */}
            {!reduceMotion && (
              <span style={{
                position:   'absolute',
                bottom:     '100%',
                left:       '50%',
                fontSize:   12,
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
            )}
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {act.label}
              </span>
              <span style={{
                fontSize:  15,
                fontWeight: 800,
                color:     BRAND.xp,
                marginLeft: 8,
                flexShrink: 0,
                display:   'inline-block',
                fontVariantNumeric: 'tabular-nums',
                animation: reduceMotion ? undefined : 'xp-amount-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.18s both',
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
                background: barColor,
                borderRadius: 99,
                transition: reduceMotion ? undefined : 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {data.xpTotal.toLocaleString('es-CO')} XP
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {data.currentLevel === 'DIAMANTE'
                  ? 'Nivel máximo'
                  : `${data.xpToNextLevel.toLocaleString('es-CO')} para el siguiente`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tarjeta level-up ─────────────────────────────────────────── */}
        {showLevelUp && data.leveledUp && data.newLevel && newLv && NewLvIcon && (
          <div
            key={`lvl-${animKey}`}
            style={{
              position:     'relative',
              width:        '100%',
              background:   levelSheen(data.newLevel),
              border:       `1px solid ${newLv.grad[1]}`,
              borderRadius: 18,
              padding:      '12px 16px',
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              boxShadow:    `0 10px 34px ${newLv.accent}44`,
              overflow:     'hidden',
              color:        newLv.onGrad,
              animation:    reduceMotion ? undefined : 'xp-levelup-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Shimmer sweep dorado — omitido en reduced-motion */}
            {!reduceMotion && (
              <div style={{
                position:   'absolute',
                top:        0,
                left:       0,
                width:      '60%',
                height:     '100%',
                background: `linear-gradient(90deg, transparent 0%, ${BRAND.amarillo}55 50%, transparent 100%)`,
                animation:  'xp-shimmer 0.9s ease-in-out 0.1s both',
                pointerEvents: 'none',
              }} />
            )}

            {/* Partículas doradas — omitidas en reduced-motion */}
            {!reduceMotion && <LevelUpParticles color={BRAND.amarillo} />}

            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.16)',
              boxShadow: MEDALLION_BEVEL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NewLvIcon style={{ width: 20, height: 20, color: newLv.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingUp style={{ width: 14, height: 14, color: newLv.onGrad }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: newLv.onGrad }}>¡Subiste de nivel!</span>
              </div>
              <span style={{ fontSize: 12, color: newLv.onGrad, opacity: 0.85 }}>
                {levelTheme(data.currentLevel).label} → <span style={{ fontWeight: 800, opacity: 1 }}>{newLv.label}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

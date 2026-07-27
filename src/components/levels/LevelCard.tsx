'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { levelService } from '@/services/LevelService'
import type { LevelProfile } from '@/types/level'
import { BRAND, levelTheme, levelGradient, levelSheen, MEDALLION_BEVEL } from './levelTheme'

const LEVEL_ICONS: Record<string, string> = {
  BRONCE:    'ti-medal',
  PLATA:     'ti-medal-2',
  ORO:       'ti-trophy',
  RUBI:      'ti-diamond',
  ESMERALDA: 'ti-star',
  DIAMANTE:  'ti-crown',
}

export function LevelCard() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<LevelProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.accessToken) return
    levelService
      .getProfile(session.accessToken as string)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  if (loading) return <LevelCardSkeleton />
  if (!profile) return null

  const theme  = levelTheme(profile.currentLevel)
  const icon   = LEVEL_ICONS[profile.currentLevel]
  const label  = theme.label

  const xpMax      = profile.xpTotal + profile.xpToNextLevel
  const progressPct = xpMax > 0
    ? Math.min((profile.xpTotal / xpMax) * 100, 100)
    : 100

  const missionPct = profile.reactivationMissionActive &&
    profile.reactivationXpGoal
    ? Math.min(
        ((profile.reactivationXpProgress ?? 0) / profile.reactivationXpGoal) * 100,
        100
      )
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>

      {/* Tarjeta principal */}
      <div className="level-card">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 6px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
              Nivel actual
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, background: theme.soft, color: theme.on, padding: '3px 10px', borderRadius: 999, fontVariantNumeric: 'tabular-nums' }}>
                ×{profile.multiplier.toFixed(1)}
              </span>
            </div>
          </div>
          {/* Medallón acuñado */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: levelSheen(profile.currentLevel),
            boxShadow: `${MEDALLION_BEVEL}, 0 8px 20px ${theme.accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: 24, color: theme.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} aria-hidden="true" />
          </div>
        </div>

        {/* Barra XP */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Progreso XP</span>
            <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {profile.xpTotal.toLocaleString()} / {xpMax.toLocaleString()} XP
            </span>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: levelGradient(profile.currentLevel, 90), borderRadius: 99, transform: `scaleX(${progressPct / 100})`, transformOrigin: 'left', transition: 'transform 0.6s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '6px 0 0' }}>
            {profile.currentLevel === 'DIAMANTE'
              ? 'Nivel máximo alcanzado'
              : `${profile.xpToNextLevel.toLocaleString()} XP para el siguiente nivel`}
          </p>
        </div>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 4px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>XP total</p>
            <p style={{ fontSize: 20, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{profile.xpTotal.toLocaleString()}</p>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 4px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Multiplicador</p>
            <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: BRAND.azulMedianoche, fontVariantNumeric: 'tabular-nums' }}>×{profile.multiplier.toFixed(1)}</p>
          </div>
        </div>

        {/* Banner pausado */}
        {profile.benefitsPaused && (
          <div style={{ marginTop: '1rem', background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16, color: '#A32D2D' }} aria-hidden="true" />
            <span style={{ fontSize: 13, color: '#A32D2D' }}>
              Beneficios pausados — completa la misión de reactivación
            </span>
          </div>
        )}
      </div>

      {/* Misión de reactivación */}
      {profile.reactivationMissionActive && profile.reactivationXpGoal && (
        <div className="level-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="ti ti-target" style={{ fontSize: 16, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Misión de reactivación</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Progreso</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {profile.reactivationXpProgress ?? 0} / {profile.reactivationXpGoal} XP
            </span>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${missionPct}%`, height: '100%', background: `linear-gradient(90deg, ${BRAND.azulClaroDark}, ${BRAND.azulClaro})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '6px 0 0' }}>
            {(profile.reactivationXpGoal - (profile.reactivationXpProgress ?? 0)).toLocaleString()} XP restantes
          </p>
        </div>
      )}

      <style>{`
        .level-card {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          padding: 1.5rem;
        }
      `}</style>
    </div>
  )
}

function LevelCardSkeleton() {
  return (
    <div style={{ maxWidth: 480, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1.5rem' }}>
      {[80, 140, 60].map((w, i) => (
        <div key={i} style={{ height: 16, width: w, background: 'var(--color-background-secondary)', borderRadius: 8, marginBottom: 12, opacity: 0.7 }} />
      ))}
    </div>
  )
}
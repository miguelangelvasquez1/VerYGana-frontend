'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { levelService } from '@/services/LevelService'
import type { LevelProfile } from '@/types/level'

const LEVEL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  BRONCE:    { bg: '#FAEEDA', text: '#854F0B', bar: '#BA7517' },
  PLATA:     { bg: '#F1EFE8', text: '#5F5E5A', bar: '#888780' },
  ORO:       { bg: '#FAEEDA', text: '#633806', bar: '#EF9F27' },
  RUBI:      { bg: '#FBEAF0', text: '#72243E', bar: '#D4537E' },
  ESMERALDA: { bg: '#E1F5EE', text: '#085041', bar: '#1D9E75' },
  DIAMANTE:  { bg: '#E6F1FB', text: '#0C447C', bar: '#378ADD' },
}

const LEVEL_ICONS: Record<string, string> = {
  BRONCE:    'ti-medal',
  PLATA:     'ti-medal-2',
  ORO:       'ti-trophy',
  RUBI:      'ti-diamond',
  ESMERALDA: 'ti-star',
  DIAMANTE:  'ti-crown',
}

const LEVEL_LABELS: Record<string, string> = {
  BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro',
  RUBI: 'Rubí', ESMERALDA: 'Esmeralda', DIAMANTE: 'Diamante',
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

  const colors = LEVEL_COLORS[profile.currentLevel]
  const icon   = LEVEL_ICONS[profile.currentLevel]
  const label  = LEVEL_LABELS[profile.currentLevel]

  const xpMax      = profile.xpTotal + profile.xpToNextLevel
  const progressPct = xpMax > 0
    ? Math.min((profile.xpTotal / xpMax) * 100, 100)
    : 100

  const missionPct = profile.reactivationMissionActive &&
    profile.reactivationKeysGoal
    ? Math.min(
        ((profile.reactivationKeysProgress ?? 0) / profile.reactivationKeysGoal) * 100,
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
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nivel actual
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, background: colors.bg, color: colors.text, padding: '3px 10px', borderRadius: 8 }}>
                ×{profile.multiplier.toFixed(1)}
              </span>
            </div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`ti ${icon}`} style={{ fontSize: 24, color: colors.text }} aria-hidden="true" />
          </div>
        </div>

        {/* Barra XP */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Progreso XP</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {profile.xpTotal.toLocaleString()} / {xpMax.toLocaleString()} XP
            </span>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: colors.bar, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '6px 0 0' }}>
            {profile.currentLevel === 'DIAMANTE'
              ? 'Nivel máximo alcanzado'
              : `${profile.xpToNextLevel.toLocaleString()} XP para el siguiente nivel`}
          </p>
        </div>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 4px' }}>XP total</p>
            <p style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>{profile.xpTotal.toLocaleString()}</p>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 4px' }}>Multiplicador</p>
            <p style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>×{profile.multiplier.toFixed(1)}</p>
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
      {profile.reactivationMissionActive && profile.reactivationKeysGoal && (
        <div className="level-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="ti ti-target" style={{ fontSize: 16, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Misión de reactivación</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Progreso</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {profile.reactivationKeysProgress ?? 0} / {profile.reactivationKeysGoal} XP
            </span>
          </div>
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${missionPct}%`, height: '100%', background: '#1D9E75', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '6px 0 0' }}>
            {(profile.reactivationKeysGoal - (profile.reactivationKeysProgress ?? 0)).toLocaleString()} XP restantes
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
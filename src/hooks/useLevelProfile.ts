import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { levelService } from '@/services/LevelService'
import type { LevelProfile } from '@/types/level'

const LEVEL_COLORS = {
  BRONCE:    { bar: '#d97706', badge: '#fef3c7', text: '#92400e' },
  PLATA:     { bar: '#9ca3af', badge: '#f3f4f6', text: '#374151' },
  ORO:       { bar: '#fbbf24', badge: '#fef9c3', text: '#713f12' },
  RUBI:      { bar: '#f43f5e', badge: '#ffe4e6', text: '#9f1239' },
  ESMERALDA: { bar: '#10b981', badge: '#d1fae5', text: '#065f46' },
  DIAMANTE:  { bar: '#60a5fa', badge: '#dbeafe', text: '#1e40af' },
} as const

const LEVEL_LABELS: Record<string, string> = {
  BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro',
  RUBI: 'Rubí', ESMERALDA: 'Esmeralda', DIAMANTE: 'Diamante',
}

export function useLevelProfile() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<LevelProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = (session as any)?.accessToken as string | undefined
    if (!token) return
    levelService.getProfile(token)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  const colors = profile
    ? LEVEL_COLORS[profile.currentLevel] ?? LEVEL_COLORS.BRONCE
    : LEVEL_COLORS.BRONCE

  const xpMax = profile ? profile.xpTotal + profile.xpToNextLevel : 1000
  const pct = profile ? Math.min((profile.xpTotal / xpMax) * 100, 100) : 0
  const label = profile ? LEVEL_LABELS[profile.currentLevel] ?? profile.currentLevel : ''

  return { profile, loading, colors, pct, label }
}
import { useQuery } from '@tanstack/react-query'
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

// Query key shared with every flow that earns XP (surveys, ads, referrals,
// purchases…) — after fetching a fresh profile from /api/levels/me for the
// XP reward toast, those flows push it into this same cache entry so the
// navbar's XP bar updates immediately, without a second fetch.
export const levelKeys = {
  profile: () => ['levelProfile'] as const,
}

export function useLevelProfile() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken as string | undefined

  const { data: profile, isLoading: loading } = useQuery<LevelProfile>({
    queryKey: levelKeys.profile(),
    queryFn: () => levelService.getProfile(token!),
    enabled: !!token,
    staleTime: 60_000,
  })

  const colors = profile
    ? LEVEL_COLORS[profile.currentLevel] ?? LEVEL_COLORS.BRONCE
    : LEVEL_COLORS.BRONCE

  const xpMax = profile ? profile.xpTotal + profile.xpToNextLevel : 1000
  const pct = profile ? Math.min((profile.xpTotal / xpMax) * 100, 100) : 0
  const label = profile ? LEVEL_LABELS[profile.currentLevel] ?? profile.currentLevel : ''

  return { profile: profile ?? null, loading, colors, pct, label }
}

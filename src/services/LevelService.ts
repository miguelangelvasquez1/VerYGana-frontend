import type { LevelProfile, TransactionLog, LevelConfig, PagedResponse } from '@/types/level'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export const levelService = {
  getProfile: (token: string) =>
    apiFetch<LevelProfile>('/api/levels/me', token),

  getHistory: (token: string, page = 0, size = 10) =>
    apiFetch<PagedResponse<TransactionLog>>(
      `/api/levels/me/history?page=${page}&size=${size}`, token
    ),

  getConfig: (token: string) =>
    apiFetch<LevelConfig[]>('/api/levels/config', token),
}
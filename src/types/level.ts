export interface LevelProfile {
  currentLevel: 'BRONCE' | 'PLATA' | 'ORO' | 'RUBI' | 'ESMERALDA' | 'DIAMANTE'
  xpTotal: number
  xpToNextLevel: number
  multiplier: number
  benefitsPaused: boolean
  reactivationMissionActive: boolean
  reactivationXpGoal: number | null
  reactivationXpProgress: number | null
}

export interface TransactionLog {
  id: number
  activityType: 'SURVEY_COMPLETED' | 'VIDEO_WATCHED' | 'GAME_PLAYED' | 'REFERRAL_ACTIVE' | 'PURCHASE'
  xpEarned: number
  multiplierApplied: number
  createdAt: string
}

export interface LevelConfig {
  level: string
  xpMin: number
  xpMax: number | string
  multiplier: number
  referralTickets: number
  raffleTickets: number
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  last: boolean
}
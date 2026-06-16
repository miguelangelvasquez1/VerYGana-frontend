import { useState, useCallback } from 'react'
import type { XpRewardData } from '@/components/levels/XpRewardToast'

export function useXpReward() {
  const [rewardData, setRewardData] = useState<XpRewardData | null>(null)

  const showReward = useCallback((data: XpRewardData) => {
    setRewardData(data)
  }, [])

  const dismiss = useCallback(() => {
    setRewardData(null)
  }, [])

  return { rewardData, showReward, dismiss }
}
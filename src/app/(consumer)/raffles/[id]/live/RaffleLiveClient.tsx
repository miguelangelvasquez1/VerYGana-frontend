'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useRaffleDraw } from '@/hooks/UseRaffleDraw'
import { DrawEventType } from '@/types/raffles/drawEvents.types'
import { WaitingRoomScreen } from '@/components/consumer/raffles/draw/WaitingRoomScreen'
import { DrawingScreen } from '@/components/consumer/raffles/draw/DrawingScreen'
import { WinnerRevealScreen } from '@/components/consumer/raffles/draw/WinnerRevealScreen'
import { DrawCompletedScreen } from '@/components/consumer/raffles/draw/DrawCompletedScreen'
import { AnnouncingScreen } from '@/components/consumer/raffles/draw/AnnouncingScreen'
import LastRafflesResultsPanel from '@/components/consumer/raffles/LastRafflesResultsPanel'
import LastWinnersPanel from '@/components/consumer/raffles/LastWinnersPanel'
import { PrizeResponseDTO } from '@/types/raffles/prize.types'

interface Props {
  raffleId: number
  raffle: { title: string; imageUrl?: string; prizes?: PrizeResponseDTO[] }
}

export function RaffleLiveClient({ raffleId, raffle }: Props) {
  const initialPrizes = raffle.prizes ?? []
  const router = useRouter()
  const {
    currentPhase,
    waitingRoom,
    revealedWinners,
    totalWinners,
    totalTickets,
    maxTickets,
    drawCompleted,
    errorMessage,
    announcementLabel,
    announcementPosition,
  } = useRaffleDraw(raffleId)

  useEffect(() => {
    if (currentPhase !== DrawEventType.DRAW_COMPLETED) return
    const timer = setTimeout(() => router.push('/raffles'), 20_000)
    return () => clearTimeout(timer)
  }, [currentPhase, router])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex gap-6 px-4 sm:px-6 lg:px-8 py-10 max-w-full">

        {/* Contenido principal centrado */}
        <main className="flex-1 min-w-0 flex flex-col items-center justify-center">

          {/* Título de la rifa */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight text-center leading-tight">
            {raffle.title}
          </h1>

          {/* Pantalla activa — AnimatePresence maneja transiciones */}
          <AnimatePresence mode="wait">

            {currentPhase === DrawEventType.WAITING_ROOM_UPDATE && waitingRoom && (
              <motion.div key="waiting" className="w-full flex justify-center"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <WaitingRoomScreen payload={waitingRoom} initialPrizes={initialPrizes} />
              </motion.div>
            )}

            {(currentPhase === DrawEventType.DRAWING_STARTED ||
              currentPhase === DrawEventType.REVEALING) && (
              <motion.div key="drawing" className="w-full flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.35 }}>
                <DrawingScreen
                  totalWinners={totalWinners}
                  totalTickets={totalTickets}
                  maxTickets={maxTickets}
                  revealNumber={currentPhase === DrawEventType.REVEALING ? revealedWinners.length + 1 : 1}
                  isRevealing={currentPhase === DrawEventType.REVEALING}
                />
              </motion.div>
            )}

            {currentPhase === DrawEventType.ANNOUNCING && (
              <motion.div key="announcing" className="w-full flex justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}>
                <AnnouncingScreen label={announcementLabel} position={announcementPosition} />
              </motion.div>
            )}

            {currentPhase === DrawEventType.WINNER_REVEALED && revealedWinners.length > 0 && (
              <motion.div key="reveal" className="w-full flex justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <WinnerRevealScreen
                  winners={revealedWinners}
                  totalWinners={totalWinners}
                />
              </motion.div>
            )}

            {currentPhase === DrawEventType.DRAW_COMPLETED && drawCompleted && (
              <motion.div key="completed" className="w-full flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <DrawCompletedScreen
                  payload={drawCompleted}
                  onGoToRaffles={() => router.push('/rifas')}
                />
              </motion.div>
            )}

            {currentPhase === DrawEventType.DRAW_ERROR && (
              <motion.div key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-red-500 text-center">{errorMessage}</p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Sidebar derecho — igual que en raffles/page.tsx */}
        <aside className="hidden xl:block w-[320px] shrink-0">
          <div className="sticky top-24 space-y-4">
            <LastRafflesResultsPanel />
            <LastWinnersPanel />
          </div>
        </aside>

      </div>
    </div>
  )
}

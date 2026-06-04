// app/raffles/[id]/live/RaffleLiveClient.tsx
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

interface Props {
  raffleId: number
  raffle: { title: string; imageUrl?: string }
}

export function RaffleLiveClient({ raffleId, raffle }: Props) {
  const router = useRouter()
  const {
    currentPhase,
    isConnected,
    waitingRoom,
    revealedWinners,
    totalWinners,
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-4 lg:p-10">

      {/* Badge de conexión */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className="text-xs text-gray-500">
          {isConnected ? 'En vivo' : 'Reconectando...'}
        </span>
      </div>

      {/* Título de la rifa */}
      <p className="text-gray-500 text-sm mb-8 tracking-wide uppercase text-center">
        {raffle.title}
      </p>

      {/* Pantalla activa — AnimatePresence maneja transiciones */}
      <AnimatePresence mode="wait">

        {/* WaitingRoom: solo mientras el countdown no ha llegado a 0 */}
        {currentPhase === DrawEventType.WAITING_ROOM_UPDATE && waitingRoom && (
          <motion.div key="waiting" className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <WaitingRoomScreen payload={waitingRoom} />
          </motion.div>
        )}

        {/* DrawingScreen: DRAWING_STARTED (inmediato tras "¡Ya!") y REVEALING (por ganador)
            comparten key="drawing" → no hay exit/enter entre fases, animación continua.
            DrawingScreen recibe una key interna para resetear el timer por cada ganador. */}
        {(currentPhase === DrawEventType.DRAWING_STARTED ||
          currentPhase === DrawEventType.REVEALING) && (
          <motion.div key="drawing" className="w-full flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.35 }}>
            <DrawingScreen
              key={currentPhase === DrawEventType.REVEALING ? `r-${revealedWinners.length + 1}` : 'pre'}
              totalWinners={totalWinners}
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
    </div>
  )
}

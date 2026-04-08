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
  } = useRaffleDraw(raffleId)

  // Redirección automática 15 segundos después de que termine el sorteo
  useEffect(() => {
    if (currentPhase !== DrawEventType.DRAW_COMPLETED) return
    const timer = setTimeout(() => router.push('/raffles'), 15_000)
    return () => clearTimeout(timer)
  }, [currentPhase, router])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">

      {/* Badge de conexión */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-xs text-gray-400">
          {isConnected ? 'En vivo' : 'Reconectando...'}
        </span>
      </div>

      {/* Título de la rifa */}
      <p className="text-gray-400 text-sm mb-8 tracking-wide uppercase">
        {raffle.title}
      </p>

      {/* Pantalla activa según la fase — AnimatePresence maneja las transiciones */}
      <AnimatePresence mode="wait">
        {currentPhase === DrawEventType.WAITING_ROOM_UPDATE && waitingRoom && (
          <motion.div key="waiting"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <WaitingRoomScreen payload={waitingRoom} />
          </motion.div>
        )}

        {currentPhase === DrawEventType.DRAWING_STARTED && (
          <motion.div key="drawing"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
            <DrawingScreen totalWinners={totalWinners} />
          </motion.div>
        )}

        {currentPhase === DrawEventType.ANNOUNCING && (
          <motion.div key="announcing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <AnnouncingScreen label={announcementLabel} />
          </motion.div>
        )}

        {currentPhase === DrawEventType.REVEALING && (
          <motion.div key="revealing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <DrawingScreen
              totalWinners={totalWinners}
              revealNumber={revealedWinners.length + 1}  // "Revelando ganador 2 de 3"
              isRevealing={true}
            />
          </motion.div>
        )}

        {(currentPhase === DrawEventType.WINNER_REVEALED ||
          currentPhase === DrawEventType.DRAWING_STARTED) &&
          revealedWinners.length > 0 && (
            <motion.div key="reveal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <WinnerRevealScreen
                winners={revealedWinners}
                totalWinners={totalWinners}
              />
            </motion.div>
          )}

        {currentPhase === DrawEventType.DRAW_COMPLETED && drawCompleted && (
          <motion.div key="completed"
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
            <p className="text-red-400 text-center">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
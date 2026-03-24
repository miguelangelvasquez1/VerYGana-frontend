// src/components/raffle-draw/WinnerRevealScreen.tsx
'use client'

import { motion } from 'framer-motion'
import { WinnerRevealPayloadDTO } from '@/types/raffles/drawEvents.types'
import { WinnerCard } from './WinnerCard'

interface Props {
  winners: WinnerRevealPayloadDTO[]
  totalWinners: number
}

export function WinnerRevealScreen({ winners, totalWinners }: Props) {
  const latest = winners[winners.length - 1]

  return (
    <div className="flex flex-col items-center gap-8 text-center w-full max-w-lg">

      {/* Progreso */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Ganadores revelados</span>
          <span>{winners.length} de {totalWinners}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <motion.div
            className="bg-violet-500 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(winners.length / totalWinners) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Flash del último ganador revelado */}
      {latest && (
        <motion.div
          key={latest.ticketNumber}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-full"
        >
          {/* Destello detrás de la carta del último ganador */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-violet-500/20 rounded-2xl"
            />
            <WinnerCard winner={latest} index={0} animated={false} />
          </div>
        </motion.div>
      )}

      {/* Ganadores anteriores en escala reducida */}
      {winners.length > 1 && (
        <div className="w-full space-y-2">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">
            Ganadores anteriores
          </p>
          {winners.slice(0, -1).map((winner, i) => (
            <motion.div
              key={winner.ticketNumber}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="scale-95 origin-top"
            >
              <WinnerCard winner={winner} index={i} animated={false} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Indicador de espera si faltan ganadores */}
      {winners.length < totalWinners && (
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2 text-gray-500 text-sm"
        >
          <span>Preparando siguiente ganador</span>
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1 h-1 rounded-full bg-gray-500 inline-block"
              />
            ))}
          </span>
        </motion.div>
      )}
    </div>
  )
}
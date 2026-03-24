// src/components/raffle-draw/WinnerCard.tsx
'use client'

import { motion } from 'framer-motion'
import { WinnerRevealPayloadDTO } from '@/types/raffles/drawEvents.types'

interface Props {
  winner: WinnerRevealPayloadDTO
  index: number        // para el stagger delay
  animated?: boolean   // false en DrawCompletedScreen para no re-animar
}

const positionLabel: Record<number, string> = {
  1: '1er lugar',
  2: '2do lugar',
  3: '3er lugar',
}

function getPositionLabel(position: number): string {
  return positionLabel[position] ?? `${position}° lugar`
}

function getInitials(userName: string): string {
  return userName.slice(0, 2).toUpperCase()
}

// Color del avatar según posición
const avatarColors: Record<number, string> = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-amber-600 to-amber-700',
}

function getAvatarColor(position: number): string {
  return avatarColors[position] ?? 'from-violet-500 to-purple-600'
}

export function WinnerCard({ winner, index, animated = true }: Props) {
  const content = (
    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-md">

      {/* Avatar con iniciales */}
      <div className={`
        w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(winner.position)}
        flex items-center justify-center text-white font-bold text-sm flex-shrink-0
      `}>
        {getInitials(winner.userName)}
      </div>

      {/* Info del ganador */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">{winner.userName}</p>
        <p className="text-gray-400 text-sm">
          Boleta <span className="text-violet-400 font-mono">#{winner.ticketNumber}</span>
        </p>
      </div>

      {/* Premio */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500 mb-0.5">{getPositionLabel(winner.position)}</p>
        <p className="text-white text-sm font-semibold leading-tight">{winner.prizeTitle}</p>
        <p className="text-emerald-400 text-xs font-mono">
          ${winner.prizeValue.toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  )

  if (!animated) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.15,  // stagger entre cartas
      }}
    >
      {content}
    </motion.div>
  )
}
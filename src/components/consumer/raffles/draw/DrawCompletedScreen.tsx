'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { DrawCompletedPayloadDTO, WinnerRevealPayloadDTO } from '@/types/raffles/drawEvents.types'
import { useConfetti } from '@/hooks/useConfetti'

interface Props {
  payload: DrawCompletedPayloadDTO
  onGoToRaffles: () => void
}

const REDIRECT_SECONDS = 15

const positionColors: Record<number, string> = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-amber-600 to-amber-800',
}
const positionLabel: Record<number, string> = {
  1: '1er lugar', 2: '2do lugar', 3: '3er lugar'
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function FinalWinnerCard({ winner, index }: { winner: WinnerRevealPayloadDTO; index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
      }}
      className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4"
    >
      {/* Avatar */}
      <div className={`
        relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0
        bg-gradient-to-br ${positionColors[winner.position] ?? 'from-violet-500 to-purple-600'}
        ring-2 ring-offset-2 ring-offset-gray-950
        ${winner.position === 1 ? 'ring-yellow-400' : winner.position === 2 ? 'ring-gray-300' : 'ring-amber-700'}
      `}>
        {winner.userAvatarUrl ? (
          <Image src={winner.userAvatarUrl} alt={winner.userName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-black text-white">{getInitials(winner.userName)}</span>
          </div>
        )}
      </div>

      {/* Info ganador */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-bold truncate">{winner.userName}</p>
          <span className={`
            text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r
            ${positionColors[winner.position] ?? 'from-violet-500 to-purple-600'}
            text-white flex-shrink-0
          `}>
            {positionLabel[winner.position] ?? `${winner.position}°`}
          </span>
        </div>
        <p className="text-gray-500 text-xs font-mono">#{winner.ticketNumber}</p>
      </div>

      {/* Premio con imagen */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {winner.prizeImageUrl && (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5">
            <Image src={winner.prizeImageUrl} alt={winner.prizeTitle} fill className="object-cover" />
          </div>
        )}
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-semibold max-w-[120px] truncate">{winner.prizeTitle}</p>
          <p className="text-emerald-400 text-xs font-mono">
            ${winner.prizeValue.toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function DrawCompletedScreen({ payload, onGoToRaffles }: Props) {
  const { fireCompleted } = useConfetti()
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS)

  // Confeti al montar
  useEffect(() => {
    fireCompleted()
    setTimeout(fireCompleted, 800)
  }, [fireCompleted])

  // Countdown de redirección
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(timer); onGoToRaffles(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onGoToRaffles])

  const progress = ((REDIRECT_SECONDS - remaining) / REDIRECT_SECONDS) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 w-full max-w-lg"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Sorteo completado</p>
        <h1 className="text-3xl font-black text-white mb-1">{payload.raffleTitle}</h1>
        <p className="text-gray-500 text-sm">
          {payload.totalParticipants.toLocaleString()} participantes · {payload.allWinners.length} ganadores
        </p>
      </motion.div>

      {/* Lista de ganadores con stagger */}
      <motion.div
        className="w-full space-y-3"
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        initial="hidden"
        animate="show"
      >
        {payload.allWinners.map((winner, i) => (
          <FinalWinnerCard key={winner.ticketNumber} winner={winner} index={i} />
        ))}
      </motion.div>

      {/* Botones */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 + payload.allWinners.length * 0.12 }}
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        <button
          onClick={onGoToRaffles}
          className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all"
        >
          Ver más rifas
        </button>
        
          href={payload.drawProofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-gray-300 font-semibold py-3.5 px-6 rounded-xl transition-all text-center"
        <a>
          Ver prueba del sorteo
        </a>
      </motion.div>

      {/* Barra de redirección */}
      <div className="w-full">
        <p className="text-gray-600 text-xs text-center mb-2">
          Volviendo a rifas en {remaining}s
        </p>
        <div className="w-full bg-white/5 rounded-full h-1">
          <motion.div
            className="bg-violet-500/40 h-1 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
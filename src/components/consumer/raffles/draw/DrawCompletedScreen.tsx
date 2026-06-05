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

const REDIRECT_SECONDS = 20

const podiumCfg: Record<number, {
  blockH: string
  blockHLg: string
  blockBg: string
  avatarRing: string
  avatarBg: string
  medal: string
  valueColor: string
}> = {
  1: {
    blockH:     'h-32',
    blockHLg:   'lg:h-44',
    blockBg:    'bg-linear-to-b from-yellow-400 via-amber-400 to-amber-500',
    avatarRing: 'ring-yellow-400',
    avatarBg:   'bg-linear-to-br from-yellow-400 to-amber-500',
    medal:      '🥇',
    valueColor: 'text-yellow-600',
  },
  2: {
    blockH:     'h-24',
    blockHLg:   'lg:h-32',
    blockBg:    'bg-linear-to-b from-slate-400 to-slate-600',
    avatarRing: 'ring-slate-300',
    avatarBg:   'bg-linear-to-br from-slate-300 to-slate-500',
    medal:      '🥈',
    valueColor: 'text-slate-500',
  },
  3: {
    blockH:     'h-16',
    blockHLg:   'lg:h-24',
    blockBg:    'bg-linear-to-b from-amber-600 to-amber-800',
    avatarRing: 'ring-amber-500',
    avatarBg:   'bg-linear-to-br from-amber-500 to-amber-700',
    medal:      '🥉',
    valueColor: 'text-amber-700',
  },
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function PodiumSlot({ winner, delay = 0 }: { winner: WinnerRevealPayloadDTO; delay?: number }) {
  const cfg = podiumCfg[winner.position]
  if (!cfg) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      className="flex flex-col items-center"
    >
      {/* Info encima del bloque */}
      <div className="flex flex-col items-center gap-1 mb-3 w-28 lg:w-36">
        <span className="text-2xl lg:text-3xl">{cfg.medal}</span>

        {/* Avatar */}
        <div className={`
          relative w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden shrink-0
          ${cfg.avatarBg}
          ring-4 ring-offset-2 ring-offset-gray-50 ${cfg.avatarRing}
          shadow-lg
        `}>
          {winner.userAvatarUrl ? (
            <Image
              src={winner.userAvatarUrl}
              alt={winner.userName}
              fill
              sizes="(max-width: 1024px) 64px, 80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl lg:text-2xl font-black text-white">{getInitials(winner.userName)}</span>
            </div>
          )}
        </div>

        {/* Nombre */}
        <p className="text-gray-900 font-bold text-base lg:text-xl text-center leading-tight truncate w-full">
          {winner.userName}
        </p>

        {/* Boleta */}
        <p className="text-gray-400 text-sm lg:text-base font-mono">#{winner.ticketNumber}</p>

        {/* Premio */}
        <p className="text-gray-500 text-xs lg:text-sm leading-tight truncate w-full text-center">
          {winner.prizeTitle}
        </p>
      </div>

      {/* Bloque del podio */}
      <div className={`
        w-24 lg:w-32 ${cfg.blockH} ${cfg.blockHLg} rounded-t-2xl ${cfg.blockBg}
        flex items-center justify-center shadow-md
      `}>
        <span className="text-white font-black text-3xl lg:text-5xl leading-none">
          {winner.position}°
        </span>
      </div>
    </motion.div>
  )
}

function ExtraWinnerRow({ winner, index }: { winner: WinnerRevealPayloadDTO; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
      className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-xl p-3"
    >
      <span className="text-gray-400 font-bold text-sm w-6 text-center shrink-0">
        {winner.position}°
      </span>

      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-linear-to-br from-blue-500 to-blue-700">
        {winner.userAvatarUrl ? (
          <Image src={winner.userAvatarUrl} alt={winner.userName} fill sizes="36px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{getInitials(winner.userName)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-base lg:text-lg font-semibold truncate">{winner.userName}</p>
        <p className="text-gray-400 text-sm font-mono">Boleta #{winner.ticketNumber}</p>
      </div>

      <p className="text-gray-700 text-sm lg:text-base font-medium truncate max-w-36 shrink-0">{winner.prizeTitle}</p>
    </motion.div>
  )
}

export function DrawCompletedScreen({ payload, onGoToRaffles }: Props) {
  const { fireCompleted } = useConfetti()
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    fireCompleted()
    setTimeout(fireCompleted, 700)
    setTimeout(fireCompleted, 1800)
  }, [fireCompleted])

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

  const podiumWinners = payload.allWinners.filter(w => w.position <= 3)
  const extraWinners  = payload.allWinners.filter(w => w.position > 3)

  const first  = podiumWinners.find(w => w.position === 1)
  const second = podiumWinners.find(w => w.position === 2)
  const third  = podiumWinners.find(w => w.position === 3)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-8 w-full max-w-2xl lg:max-w-6xl"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <p className="text-gray-500 text-sm lg:text-lg uppercase tracking-widest mb-2">¡Sorteo completado!</p>
        <h1 className="text-4xl lg:text-7xl font-black text-gray-900 mb-1">{payload.raffleTitle}</h1>
        <p className="text-gray-500 text-base lg:text-xl">
          {payload.totalParticipants.toLocaleString()} participantes
          {' · '}
          {payload.allWinners.length} {payload.allWinners.length === 1 ? 'ganador' : 'ganadores'}
        </p>
      </motion.div>

      {/* Podio: 2° izquierda · 1° centro · 3° derecha */}
      <div className="w-full flex flex-col items-center">
        <div className="flex items-end justify-center gap-2 lg:gap-4">
          {second && <PodiumSlot winner={second} delay={0.45} />}
          {first  && <PodiumSlot winner={first}  delay={0.2}  />}
          {third  && <PodiumSlot winner={third}  delay={0.65} />}
        </div>
        <div className="w-full h-2 bg-linear-to-r from-transparent via-gray-300 to-transparent rounded-full" />
      </div>

      {/* Ganadores 4°+ */}
      {extraWinners.length > 0 && (
        <div className="w-full space-y-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-400 text-xs uppercase tracking-widest text-center"
          >
            Más ganadores
          </motion.p>
          {extraWinners.map((w, i) => (
            <ExtraWinnerRow key={w.ticketNumber} winner={w} index={i} />
          ))}
        </div>
      )}

      {/* Botones */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        <button
          onClick={onGoToRaffles}
          className="flex-1 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all"
        >
          Ver más rifas
        </button>
        <a
          href={payload.drawProofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-95 border border-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all text-center"
        >
          Ver prueba del sorteo
        </a>
      </motion.div>

      {/* Barra de redirección */}
      <div className="w-full">
        <p className="text-gray-500 text-xs text-center mb-2">
          Volviendo a rifas en {remaining}s
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <motion.div
            className="bg-blue-600/40 h-1 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

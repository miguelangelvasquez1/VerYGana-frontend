'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { WinnerRevealPayloadDTO } from '@/types/raffles/drawEvents.types'
import { useConfetti } from '@/hooks/useConfetti'

interface Props {
  winners: WinnerRevealPayloadDTO[]
  totalWinners: number
}

const positionLabel: Record<number, string> = {
  1: '1er lugar', 2: '2do lugar', 3: '3er lugar'
}
const positionColors: Record<number, string> = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-amber-600 to-amber-800',
}
const positionGlow: Record<number, string> = {
  1: 'shadow-yellow-500/40',
  2: 'shadow-gray-400/40',
  3: 'shadow-amber-700/40',
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

// Tarjeta grande del ganador recién revelado
function WinnerSpotlight({ winner }: { winner: WinnerRevealPayloadDTO }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Etiqueta de posición */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex justify-center mb-4"
      >
        <span className={`
          bg-gradient-to-r ${positionColors[winner.position] ?? 'from-violet-500 to-purple-600'}
          text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest
        `}>
          {positionLabel[winner.position] ?? `${winner.position}° lugar`}
        </span>
      </motion.div>

      {/* Card principal */}
      <div className={`
        relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden
        shadow-2xl ${positionGlow[winner.position] ?? 'shadow-violet-500/30'}
      `}>

        {/* Imagen del premio como fondo difuminado */}
        {winner.prizeImageUrl && (
          <div className="absolute inset-0 opacity-10">
            <Image
              src={winner.prizeImageUrl}
              alt={winner.prizeTitle}
              fill
              className="object-cover blur-sm"
            />
          </div>
        )}

        <div className="relative p-8 flex flex-col items-center gap-6">

          {/* Avatar del ganador */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
            className={`
              relative w-24 h-24 rounded-full overflow-hidden
              ring-4 ring-offset-4 ring-offset-gray-900
              bg-gradient-to-br ${positionColors[winner.position] ?? 'from-violet-500 to-purple-600'}
              shadow-xl ${positionGlow[winner.position] ?? ''}
            `}
          >
            {winner.userAvatarUrl ? (
              <Image
                src={winner.userAvatarUrl}
                alt={winner.userName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-black text-white">
                  {getInitials(winner.userName)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Nombre del ganador */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-center"
          >
            <p className="text-white text-2xl font-black mb-1">{winner.userName}</p>
            <p className="text-gray-400 text-sm font-mono">
              Boleta <span className="text-violet-400">#{winner.ticketNumber}</span>
            </p>
          </motion.div>

          {/* Divisor */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="w-full h-px bg-white/10"
          />

          {/* Premio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 w-full"
          >
            {/* Imagen del premio */}
            {winner.prizeImageUrl && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                <Image
                  src={winner.prizeImageUrl}
                  alt={winner.prizeTitle}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Premio</p>
              <p className="text-white font-bold text-lg leading-tight truncate">
                {winner.prizeTitle}
              </p>
              <p className="text-emerald-400 font-mono text-sm font-semibold">
                ${winner.prizeValue.toLocaleString('es-CO')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Boleta ganadora destacada abajo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-4 flex justify-center"
      >
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-6 py-2 text-center">
          <p className="text-violet-300 text-xs mb-0.5 uppercase tracking-wider">Boleta ganadora</p>
          <p className="text-white font-black text-2xl font-mono">#{winner.ticketNumber}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Fila compacta para ganadores anteriores
function PreviousWinnerRow({ winner, index }: { winner: WinnerRevealPayloadDTO; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 0.65, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl p-3"
    >
      {/* Avatar pequeño */}
      <div className={`
        w-9 h-9 rounded-full overflow-hidden flex-shrink-0
        bg-gradient-to-br ${positionColors[winner.position] ?? 'from-violet-500 to-purple-600'}
      `}>
        {winner.userAvatarUrl ? (
          <div className="relative w-full h-full">
            <Image src={winner.userAvatarUrl} alt={winner.userName} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{getInitials(winner.userName)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{winner.userName}</p>
        <p className="text-gray-500 text-xs font-mono">#{winner.ticketNumber}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500">{positionLabel[winner.position]}</p>
        <p className="text-gray-300 text-xs font-medium truncate max-w-[100px]">{winner.prizeTitle}</p>
      </div>
    </motion.div>
  )
}

export function WinnerRevealScreen({ winners, totalWinners }: Props) {
  const { fireWinner } = useConfetti()
  const lastCount      = useRef(0)
  const latest         = winners[winners.length - 1]
  const previous       = winners.slice(0, -1)

  // Disparar confeti cada vez que llega un nuevo ganador
  useEffect(() => {
    if (winners.length > lastCount.current) {
      lastCount.current = winners.length
      // Pequeño delay para que el confeti coincida con el pico de la animación
      setTimeout(fireWinner, 400)
    }
  }, [winners.length, fireWinner])

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">

      {/* Barra de progreso */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span className="uppercase tracking-wider">Ganadores revelados</span>
          <span className="font-mono text-white">{winners.length} / {totalWinners}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${(winners.length / totalWinners) * 100}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Spotlight del ganador actual */}
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            key={latest.ticketNumber}
            className="w-full"
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WinnerSpotlight winner={latest} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ganadores anteriores */}
      {previous.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-gray-600 text-xs uppercase tracking-widest text-center">
            Ganadores anteriores
          </p>
          {previous.map((w, i) => (
            <PreviousWinnerRow key={w.ticketNumber} winner={w} index={i} />
          ))}
        </div>
      )}

      {/* Esperando siguiente ganador */}
      {winners.length < totalWinners && (
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="flex items-center gap-3 text-gray-500 text-sm"
        >
          <span>Revelando siguiente ganador</span>
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"
              />
            ))}
          </span>
        </motion.div>
      )}
    </div>
  )
}
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
  1: '1er lugar', 2: '2do lugar', 3: '3er lugar',
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

function WinnerSpotlight({ winner }: { winner: WinnerRevealPayloadDTO }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="w-full max-w-sm lg:max-w-md mx-auto"
    >
      {/* Etiqueta de posición */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex justify-center mb-4"
      >
        <span className={`
          bg-linear-to-r ${positionColors[winner.position] ?? 'from-blue-500 to-blue-700'}
          text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest
        `}>
          {positionLabel[winner.position] ?? `${winner.position}° lugar`}
        </span>
      </motion.div>

      {/* Card principal */}
      <div className={`
        relative bg-white border border-gray-200 rounded-3xl overflow-hidden
        shadow-2xl ${positionGlow[winner.position] ?? 'shadow-blue-500/30'}
      `}>
        {/* Imagen del premio como fondo difuminado */}
        {winner.prizeImageUrl && (
          <div className="absolute inset-0 opacity-10">
            <Image
              src={winner.prizeImageUrl}
              alt={winner.prizeTitle}
              fill
              sizes="600px"
              className="object-cover blur-sm"
            />
          </div>
        )}

        <div className="relative p-8 lg:p-10 flex flex-col items-center gap-6">

          {/* Avatar */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
            className={`
              relative w-28 h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden
              ring-4 ring-offset-4 ring-offset-white
              bg-linear-to-br ${positionColors[winner.position] ?? 'from-blue-500 to-blue-700'}
              shadow-xl ${positionGlow[winner.position] ?? ''}
            `}
          >
            {winner.userAvatarUrl ? (
              <Image
                src={winner.userAvatarUrl}
                alt={winner.userName}
                fill
                sizes="(max-width: 1024px) 112px, 144px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl lg:text-5xl font-black text-white">
                  {getInitials(winner.userName)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Nombre */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-center"
          >
            <p className="text-gray-900 text-2xl lg:text-4xl font-black mb-1">{winner.userName}</p>
            <p className="text-gray-500 text-sm font-mono">
              Boleta <span className="text-blue-600">#{winner.ticketNumber}</span>
            </p>
          </motion.div>

          {/* Divisor */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="w-full h-px bg-gray-200"
          />

          {/* Premio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 w-full"
          >
            {winner.prizeImageUrl ? (
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <Image
                  src={winner.prizeImageUrl}
                  alt={winner.prizeTitle}
                  fill
                  sizes="(max-width: 1024px) 64px, 80px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Premio</p>
              <p className="text-gray-900 font-bold text-lg lg:text-xl leading-tight truncate">
                {winner.prizeTitle}
              </p>
              <p className="text-emerald-600 font-mono text-sm lg:text-base font-semibold">
                ${winner.prizeValue.toLocaleString('es-CO')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Boleta destacada */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-4 flex justify-center"
      >
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-2 text-center">
          <p className="text-blue-600 text-xs mb-0.5 uppercase tracking-wider">Boleta ganadora</p>
          <p className="text-gray-900 font-black text-2xl lg:text-3xl font-mono">#{winner.ticketNumber}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PreviousWinnerRow({ winner, index }: { winner: WinnerRevealPayloadDTO; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 0.7, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3"
    >
      <div className={`
        w-9 h-9 rounded-full overflow-hidden shrink-0
        bg-linear-to-br ${positionColors[winner.position] ?? 'from-blue-500 to-blue-700'}
      `}>
        {winner.userAvatarUrl ? (
          <div className="relative w-full h-full">
            <Image src={winner.userAvatarUrl} alt={winner.userName} fill sizes="36px" className="object-cover" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{getInitials(winner.userName)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-gray-800 text-sm font-semibold truncate">{winner.userName}</p>
        <p className="text-gray-500 text-xs font-mono">#{winner.ticketNumber}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">{positionLabel[winner.position] ?? `${winner.position}° lugar`}</p>
        <p className="text-gray-600 text-xs font-medium truncate max-w-28">{winner.prizeTitle}</p>
      </div>
    </motion.div>
  )
}

function PrizePanel({ winner }: { winner: WinnerRevealPayloadDTO }) {
  return (
    <motion.div
      key={winner.ticketNumber}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Premio ganado</p>

      {winner.prizeImageUrl && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 mb-4">
          <Image
            src={winner.prizeImageUrl}
            alt={winner.prizeTitle}
            fill
            sizes="384px"
            className="object-cover"
          />
        </div>
      )}

      <p className="text-gray-900 font-black text-2xl leading-tight mb-2">
        {winner.prizeTitle}
      </p>
      <p className="text-emerald-600 font-mono text-xl font-bold">
        ${winner.prizeValue.toLocaleString('es-CO')}
      </p>
    </motion.div>
  )
}

export function WinnerRevealScreen({ winners, totalWinners }: Props) {
  const { fireWinner } = useConfetti()
  const lastCount      = useRef(0)
  const latest         = winners[winners.length - 1]
  const previous       = winners.slice(0, -1)

  useEffect(() => {
    if (winners.length > lastCount.current) {
      lastCount.current = winners.length
      setTimeout(fireWinner, 400)
      setTimeout(fireWinner, 900)
    }
  }, [winners.length, fireWinner])

  return (
    <div className="w-full max-w-lg lg:max-w-6xl">

      {/* Layout responsivo: vertical en móvil, horizontal en desktop */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">

        {/* Columna izquierda (desktop) / principal (móvil): spotlight + boleta */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Barra de progreso — solo visible en móvil aquí */}
          <div className="lg:hidden w-full">
            <ProgressBar winners={winners} totalWinners={totalWinners} />
          </div>

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
        </div>

        {/* Columna derecha (solo desktop): progreso + ganadores anteriores + premio */}
        <div className="hidden lg:flex lg:flex-col lg:gap-6 lg:w-96 lg:shrink-0 lg:pt-2">
          <ProgressBar winners={winners} totalWinners={totalWinners} />

          {previous.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs uppercase tracking-widest text-center">
                Ganadores anteriores
              </p>
              {previous.map((w, i) => (
                <PreviousWinnerRow key={w.ticketNumber} winner={w} index={i} />
              ))}
            </div>
          )}

          {winners.length < totalWinners && (
            <NextWinnerIndicator />
          )}

          {/* Premio del ganador actual — grande y llamativo */}
          {latest && <PrizePanel winner={latest} />}
        </div>

      </div>

      {/* Ganadores anteriores — solo visible en móvil */}
      {previous.length > 0 && (
        <div className="lg:hidden mt-6 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest text-center">
            Ganadores anteriores
          </p>
          {previous.map((w, i) => (
            <PreviousWinnerRow key={w.ticketNumber} winner={w} index={i} />
          ))}
        </div>
      )}

      {winners.length < totalWinners && (
        <div className="lg:hidden mt-4 flex justify-center">
          <NextWinnerIndicator />
        </div>
      )}
    </div>
  )
}

function ProgressBar({ winners, totalWinners }: { winners: WinnerRevealPayloadDTO[]; totalWinners: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span className="uppercase tracking-wider">Ganadores revelados</span>
        <span className="font-mono text-gray-900">{winners.length} / {totalWinners}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <motion.div
          className="h-1.5 rounded-full bg-linear-to-r from-blue-700 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${(winners.length / totalWinners) * 100}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function NextWinnerIndicator() {
  return (
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
            className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"
          />
        ))}
      </span>
    </motion.div>
  )
}

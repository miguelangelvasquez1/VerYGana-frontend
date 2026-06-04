'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  totalWinners: number
  revealNumber?: number
  isRevealing?: boolean
}

function randomTicket(): string {
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
}

const MESSAGES_INITIAL = [
  'Girando todos los boletos...',
  'El destino decide...',
  'Un boleto va a cambiar todo...',
  '¡Cualquiera puede ser el ganador!',
]

function getSuspenseMessages(isRevealing: boolean, revealNumber: number, totalWinners: number) {
  if (!isRevealing) return MESSAGES_INITIAL
  return [
    `Premio ${revealNumber} de ${totalWinners}...`,
    'Girando los números...',
    'El siguiente boleto está por salir...',
    '¡El destino tiene la palabra!',
  ]
}

type Phase = 'fast' | 'slowing' | 'suspense'

export function DrawingScreen({ totalWinners, revealNumber = 1, isRevealing = false }: Props) {
  const [ticket, setTicket] = useState(randomTicket())
  const [phase, setPhase]   = useState<Phase>('fast')
  const [msgIndex, setMsgIndex] = useState(0)
  const elapsed = useRef(0)

  // Progresión de fases: fast (0–3 s), slowing (3–6 s), suspense (6 s+)
  useEffect(() => {
    const timer = setInterval(() => {
      elapsed.current += 500
      if (elapsed.current === 3000) setPhase('slowing')
      if (elapsed.current === 6000) setPhase('suspense')
    }, 500)
    return () => clearInterval(timer)
  }, [])

  // Velocidad de giro según fase
  useEffect(() => {
    const speed = phase === 'fast' ? 55 : phase === 'slowing' ? 280 : 650
    const interval = setInterval(() => setTicket(randomTicket()), speed)
    return () => clearInterval(interval)
  }, [phase])

  // Rotar mensajes de suspenso
  useEffect(() => {
    if (phase !== 'suspense') return
    const messages = getSuspenseMessages(isRevealing, revealNumber, totalWinners)
    const timer = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [phase, isRevealing, revealNumber, totalWinners])

  const suspenseMessages = getSuspenseMessages(isRevealing, revealNumber, totalWinners)
  const isSuspense = phase === 'suspense'

  return (
    <div className="flex flex-col items-center gap-10 text-center w-full max-w-lg lg:max-w-2xl">

      {/* Badge pulsante */}
      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: isSuspense ? 0.7 : 1.2, repeat: Infinity }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200"
      >
        <motion.span
          animate={{ scale: isSuspense ? [1, 1.4, 1] : 1 }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-blue-500"
        />
        <span className="text-blue-700 text-sm font-medium tracking-wide uppercase">
          Sorteo en curso
        </span>
      </motion.div>

      {/* Ticker de boleta */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isSuspense ? [1, 1.35, 1] : [1, 1.15, 1],
            opacity: isSuspense ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
          }}
          transition={{ duration: isSuspense ? 0.75 : 1.5, repeat: Infinity }}
          className={`absolute inset-0 rounded-3xl blur-xl transition-colors duration-700 ${
            isSuspense ? 'bg-blue-500/25' : 'bg-blue-500/10'
          }`}
        />

        <motion.div
          animate={isSuspense ? { boxShadow: ['0 0 0px #3b82f6', '0 0 28px #3b82f6', '0 0 0px #3b82f6'] } : {}}
          transition={{ duration: 0.75, repeat: Infinity }}
          className={`relative bg-white shadow-lg rounded-3xl px-12 py-8 lg:px-20 lg:py-12 transition-colors duration-500 ${
            isSuspense ? 'border-2 border-blue-400' : 'border border-blue-200'
          }`}
        >
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Boleta</p>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={ticket}
              initial={{ y: phase === 'fast' ? -8 : -22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: phase === 'fast' ? 8 : 22, opacity: 0 }}
              transition={{ duration: isSuspense ? 0.45 : 0.06 }}
              className={`text-7xl lg:text-9xl font-black font-mono tracking-widest transition-colors duration-300 ${
                isSuspense ? 'text-blue-700' : 'text-gray-900'
              }`}
            >
              #{ticket}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Mensaje */}
      <div className="h-8">
        <AnimatePresence mode="wait">
          {isSuspense ? (
            <motion.p
              key={`msg-${msgIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-blue-600 text-lg font-semibold"
            >
              {suspenseMessages[msgIndex]}
            </motion.p>
          ) : (
            <motion.p
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 text-sm"
            >
              Seleccionando entre {(10000).toLocaleString()} boletas...
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="text-gray-400 text-xs">
        {isRevealing
          ? `Ganador ${revealNumber} de ${totalWinners}`
          : `${totalWinners} ${totalWinners === 1 ? 'ganador' : 'ganadores'} por revelar`
        }
      </p>
    </div>
  )
}

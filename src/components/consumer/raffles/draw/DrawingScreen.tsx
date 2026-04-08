'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  totalWinners: number
  revealNumber?: number   // qué número de ganador se está revelando
  isRevealing?: boolean   // true cuando es entre ganadores, false al inicio
}

function randomTicket(): string {
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
}

export function DrawingScreen({ totalWinners, revealNumber = 1, isRevealing = false }: Props) {
  const [ticket, setTicket] = useState(randomTicket())
  const [speed, setSpeed] = useState(60)
  const [phase, setPhase] = useState<'fast' | 'slowing' | 'suspense'>('fast')
  const elapsed = useRef(0)

  useEffect(() => {
    // Máquina de estados de la animación
    const phaseTimer = setInterval(() => {
      elapsed.current += 500

      if (elapsed.current === 3000) setPhase('slowing')
      if (elapsed.current === 6000) setPhase('suspense')
    }, 500)

    return () => clearInterval(phaseTimer)
  }, [])

  // Velocidad según fase
  useEffect(() => {
    if (phase === 'fast') setSpeed(60)
    if (phase === 'slowing') setSpeed(prev => Math.min(prev + 25, 350))
    if (phase === 'suspense') setSpeed(600)
  }, [phase])

  // Ticker central
  useEffect(() => {
    const interval = setInterval(() => setTicket(randomTicket()), speed)
    return () => clearInterval(interval)
  }, [speed])

  const suspenseMessages = isRevealing
    ? [
      `Premio ${revealNumber} de ${totalWinners}...`,
      'Girando los números...',
      'El siguiente boleto está por salir...'
    ]
    : [
      'Girando todos los boletos...',
      'El destino decide...',
      'Un boleto va a cambiar todo...'
    ]
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      elapsed.current += 500

      if (elapsed.current === 4000) setPhase('slowing')  // empieza a desacelerar a los 4s
      if (elapsed.current === 7000) setPhase('suspense') // suspense en los últimos 1s
    }, 500)

    return () => clearInterval(phaseTimer)
  }, [])

  return (
    <div className="flex flex-col items-center gap-12 text-center w-full max-w-lg">

      {/* Badge pulsante */}
      <motion.div
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30"
      >
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
        <span className="text-violet-300 text-sm font-medium tracking-wide uppercase">
          Sorteo en curso
        </span>
      </motion.div>

      {/* Ticker de boleta GRANDE — el foco principal */}
      <div className="relative">
        {/* Halo animado detrás */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl bg-violet-600/20 blur-xl"
        />
        <div className="relative bg-white/5 border border-violet-500/40 rounded-3xl px-16 py-10">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Boleta</p>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={ticket}
              initial={{ y: phase === 'fast' ? -8 : -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: phase === 'fast' ? 8 : 20, opacity: 0 }}
              transition={{ duration: phase === 'suspense' ? 0.4 : 0.06 }}
              className="text-7xl font-black text-white font-mono tracking-widest"
            >
              #{ticket}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Mensaje de suspenso */}
      <div className="h-8">
        <AnimatePresence mode="wait">
          {phase === 'suspense' ? (
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-violet-300 text-lg font-semibold"
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

      {/* Info */}
      <p className="text-gray-600 text-xs">
        {isRevealing
          ? `Ganador ${revealNumber} de ${totalWinners}`
          : `${totalWinners} ${totalWinners === 1 ? 'ganador' : 'ganadores'} por revelar`
        }
      </p>
    </div>
  )
}
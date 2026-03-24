// src/components/raffle-draw/DrawingScreen.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  totalWinners: number
}

// Genera un número de boleta aleatorio con formato de 4 dígitos
function randomTicket(): string {
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
}

// Una boleta individual que "gira" cambiando su número
function SpinningTicket({ speed }: { speed: number }) {
  const [ticket, setTicket] = useState(randomTicket())
  const [flipping, setFlipping] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setFlipping(true)
      setTimeout(() => {
        setTicket(randomTicket())
        setFlipping(false)
      }, 80)
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [speed])

  return (
    <motion.div
      animate={{ rotateY: flipping ? 90 : 0 }}
      transition={{ duration: 0.08 }}
      style={{ perspective: 400 }}
      className="bg-white/5 border border-violet-500/30 rounded-xl p-4 min-w-[88px] text-center"
    >
      <p className="text-violet-300 text-xs mb-1 font-mono">#</p>
      <p className="text-white font-bold text-xl font-mono tracking-widest">{ticket}</p>
    </motion.div>
  )
}

export function DrawingScreen({ totalWinners }: Props) {
  // La velocidad disminuye con el tiempo para crear efecto de desaceleración
  const [speed, setSpeed] = useState(80)
  const elapsed = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => {
      elapsed.current += 500

      // A los 3 segundos empieza a desacelerar
      if (elapsed.current > 3000) {
        setSpeed(prev => Math.min(prev + 15, 400))
      }
    }, 500)

    return () => clearInterval(timer)
  }, [])

  // Mostrar entre 6 y 12 boletas según cantidad de ganadores
  const ticketCount = Math.max(6, Math.min(12, totalWinners * 3))

  return (
    <div className="flex flex-col items-center gap-10 text-center">

      {/* Encabezado pulsante */}
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-3"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
        </span>
        <p className="text-violet-300 font-semibold tracking-wide uppercase text-sm">
          Seleccionando ganadores
        </p>
      </motion.div>

      {/* Grid de boletas girando */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: ticketCount }).map((_, i) => (
          <SpinningTicket key={i} speed={speed + i * 10} />
        ))}
      </div>

      <p className="text-gray-600 text-sm">
        {totalWinners} {totalWinners === 1 ? 'ganador' : 'ganadores'} por revelar
      </p>
    </div>
  )
}
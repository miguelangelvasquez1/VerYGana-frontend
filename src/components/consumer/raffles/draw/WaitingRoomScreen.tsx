// src/components/raffle-draw/WaitingRoomScreen.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WaitingRoomPayloadDTO } from '@/types/raffles/drawEvents.types'

interface Props {
  payload: WaitingRoomPayloadDTO
  raffleTitle: string
}

function formatTime(seconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

// Dígito individual con animación de flip cuando cambia
function Digit({ value }: { value: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="inline-block tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-white/10 border border-white/10 rounded-xl px-5 py-3 min-w-[72px] text-center">
        <div className="text-4xl font-bold text-white font-mono flex justify-center overflow-hidden h-10">
          <Digit value={value[0]} />
          <Digit value={value[1]} />
        </div>
      </div>
      <span className="text-gray-500 text-xs uppercase tracking-widest">{label}</span>
    </div>
  )
}

export function WaitingRoomScreen({ payload, raffleTitle }: Props) {
  // Countdown local que se decrementa cada segundo
  // Se sincroniza con el valor del servidor cada vez que llega un update
  const [seconds, setSeconds] = useState(payload.secondsUntilDraw)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sincronizar con el servidor cuando llega un nuevo payload
  useEffect(() => {
    setSeconds(payload.secondsUntilDraw)
  }, [payload.secondsUntilDraw])

  // Decrementar cada segundo localmente para que sea fluido entre updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const time = formatTime(Math.max(0, seconds))
  const showHours = seconds >= 3600

  return (
    <div className="flex flex-col items-center gap-10 text-center">

      {/* Badge en vivo */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-sm text-gray-300">
          <span className="text-white font-semibold">{payload.viewerCount}</span> viendo en vivo
        </span>
      </div>

      {/* Mensaje principal */}
      <div>
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">El sorteo comienza en</p>
        <p className="text-white font-bold text-xl">{raffleTitle}</p>
      </div>

      {/* Countdown */}
      <div className="flex items-end gap-3">
        {showHours && <TimeUnit value={time.h} label="horas" />}
        {showHours && (
          <span className="text-white/40 text-3xl font-bold mb-3">:</span>
        )}
        <TimeUnit value={time.m} label="minutos" />
        <span className="text-white/40 text-3xl font-bold mb-3">:</span>
        <TimeUnit value={time.s} label="segundos" />
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{payload.totalTickets.toLocaleString()}</p>
          <p className="text-gray-500 text-xs">boletas vendidas</p>
        </div>
      </div>

      <p className="text-gray-600 text-xs max-w-xs">
        Mantén esta pantalla abierta. El sorteo empezará automáticamente.
      </p>
    </div>
  )
}
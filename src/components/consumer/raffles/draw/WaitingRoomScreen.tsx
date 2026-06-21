'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WaitingRoomPayloadDTO } from '@/types/raffles/drawEvents.types'

interface Props {
  payload: WaitingRoomPayloadDTO
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
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-5 py-3 lg:px-8 lg:py-4 min-w-18 lg:min-w-24 text-center">
        <div className="text-4xl lg:text-6xl font-bold text-gray-900 font-mono flex justify-center overflow-hidden h-10 lg:h-14">
          <Digit value={value[0]} />
          <Digit value={value[1]} />
        </div>
      </div>
      <span className="text-gray-400 text-xs uppercase tracking-widest">{label}</span>
    </div>
  )
}

// 13 s–11 s: "¡Empieza en..." con número central y anillo pulsante
function ImminentCountdown({ seconds, viewerCount }: { seconds: number; viewerCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
      <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-base lg:text-xl text-gray-600">
          <span className="text-gray-900 font-semibold">{viewerCount}</span> viendo en vivo
        </span>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-gray-600 text-2xl lg:text-4xl font-semibold uppercase tracking-widest"
      >
        ¡Empieza en...
      </motion.p>

      <AnimatePresence mode="wait">
        <motion.div
          key={seconds}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="relative flex items-center justify-center w-48 h-48 lg:w-64 lg:h-64"
        >
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-4 border-blue-400"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="absolute inset-4 rounded-full bg-blue-500/10"
          />
          <span className="text-9xl lg:text-[11rem] font-black text-gray-900 font-mono tabular-nums">
            {seconds}
          </span>
        </motion.div>
      </AnimatePresence>

      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="text-blue-500 text-base lg:text-xl font-medium"
      >
        ¡El sorteo está a punto de comenzar!
      </motion.p>
    </div>
  )
}

// 10 s–0 s: número gigante en pantalla completa
function BigCountdown({ seconds }: { seconds: number }) {
  const isYa   = seconds === 0
  const isLast3 = seconds <= 3 && !isYa

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-[55vh] text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={isYa ? 'ya' : seconds}
          initial={{ scale: 0.15, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 2, opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className="relative flex items-center justify-center"
        >
          {isLast3 && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-red-500/15 blur-3xl"
            />
          )}
          {isYa && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl"
            />
          )}
          <span className={[
            'font-black font-mono leading-none select-none',
            isYa    ? 'text-[22vw] lg:text-[14rem] text-blue-600' : '',
            isLast3 ? 'text-[32vw] lg:text-[20rem] text-red-500'  : '',
            !isYa && !isLast3 ? 'text-[32vw] lg:text-[20rem] text-gray-900' : '',
          ].join(' ')}>
            {isYa ? '¡Ya!' : seconds}
          </span>
        </motion.div>
      </AnimatePresence>

      {!isYa && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`text-lg lg:text-2xl font-semibold uppercase tracking-widest ${isLast3 ? 'text-red-400' : 'text-gray-500'}`}
        >
          {isLast3 ? '¡Prepárate!' : 'El sorteo comienza en...'}
        </motion.p>
      )}

      {isYa && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl lg:text-3xl font-bold text-blue-500"
        >
          ¡El sorteo ha comenzado!
        </motion.p>
      )}
    </div>
  )
}

export function WaitingRoomScreen({ payload }: Props) {
  const [seconds, setSeconds] = useState(payload.secondsUntilDraw)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSeconds(payload.secondsUntilDraw)
  }, [payload.secondsUntilDraw])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const time     = formatTime(Math.max(0, seconds))
  const showHours = seconds >= 3600

  if (seconds <= 10) return <BigCountdown seconds={seconds} />
  if (seconds <= 13) return <ImminentCountdown seconds={seconds} viewerCount={payload.viewerCount} />

  return (
    <div className="flex flex-col items-center gap-10 text-center">

      {/* Badge en vivo */}
      <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-base lg:text-xl text-gray-600">
          <span className="text-gray-900 font-semibold">{payload.viewerCount}</span> viendo en vivo
        </span>
      </div>

      <div>
        <p className="text-gray-500 text-base lg:text-xl uppercase tracking-widest mb-2">El sorteo comienza en</p>
      </div>

      <div className="flex items-end gap-3 lg:gap-5">
        {showHours && <TimeUnit value={time.h} label="horas" />}
        {showHours && <span className="text-gray-300 text-3xl lg:text-5xl font-bold mb-3">:</span>}
        <TimeUnit value={time.m} label="minutos" />
        <span className="text-gray-300 text-3xl lg:text-5xl font-bold mb-3">:</span>
        <TimeUnit value={time.s} label="segundos" />
      </div>

      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-3xl lg:text-5xl font-bold text-gray-900">{payload.totalParticipants.toLocaleString()}</p>
          <p className="text-gray-500 text-sm lg:text-base">Participantes</p>
        </div>
      </div>

      <p className="text-gray-400 text-sm lg:text-base max-w-sm">
        Mantén esta pantalla abierta. El sorteo empezará automáticamente.
      </p>
    </div>
  )
}

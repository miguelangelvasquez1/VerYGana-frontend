'use client'

import { motion } from 'framer-motion'

interface Props {
  label: string
  position?: number
}

const positionColors: Record<number, string> = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-slate-300 to-slate-500',
  3: 'from-amber-600 to-amber-800',
}

export function AnnouncingScreen({ label, position }: Props) {
  const gradient = position
    ? (positionColors[position] ?? 'from-blue-500 to-blue-700')
    : 'from-blue-500 to-blue-700'

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full max-w-lg lg:max-w-3xl min-h-80 lg:min-h-120">

      {/* Halo de fondo */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className={`absolute w-72 h-72 lg:w-96 lg:h-96 rounded-full blur-3xl bg-linear-to-br ${gradient} opacity-20 pointer-events-none`}
      />

      {/* Línea superior */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`w-20 lg:w-32 h-0.5 rounded-full bg-linear-to-r ${gradient}`}
      />

      {/* Badge de posición */}
      {position && (
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
          className={`
            inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full
            bg-linear-to-br ${gradient}
            shadow-lg text-white font-black text-3xl lg:text-4xl
          `}
        >
          {position}
        </motion.div>
      )}

      {/* "Y..." */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="text-gray-400 text-base lg:text-xl uppercase tracking-[0.3em]"
      >
        Y...
      </motion.p>

      {/* Label principal */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.75, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 220, damping: 18 }}
        className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 leading-tight px-4"
      >
        {label}...
      </motion.h1>

      {/* Puntos animados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="flex gap-2.5"
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full inline-block bg-linear-to-br ${gradient}`}
          />
        ))}
      </motion.div>

      {/* Línea inferior */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        className={`w-20 lg:w-32 h-0.5 rounded-full bg-linear-to-r ${gradient}`}
      />
    </div>
  )
}

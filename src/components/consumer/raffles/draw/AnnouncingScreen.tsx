'use client'

import { motion } from 'framer-motion'

interface Props {
  label: string  // "el primer ganador es"
}

export function AnnouncingScreen({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center w-full max-w-lg min-h-[300px]">

      {/* Línea decorativa superior */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-24 h-px bg-violet-500/60"
      />

      {/* Texto "Y..." */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-gray-400 text-lg uppercase tracking-widest"
      >
        Y...
      </motion.p>

      {/* Label principal — entra con spring */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: 0.8,
          type: 'spring',
          stiffness: 200,
          damping: 18,
        }}
        className="text-4xl sm:text-5xl font-black text-white leading-tight"
      >
        {label}...
      </motion.h1>

      {/* Puntos suspensivos animados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="flex gap-2"
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
            className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"
          />
        ))}
      </motion.div>

      {/* Línea decorativa inferior */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="w-24 h-px bg-violet-500/60"
      />
    </div>
  )
}
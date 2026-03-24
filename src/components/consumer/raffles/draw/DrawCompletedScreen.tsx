// src/components/raffle-draw/DrawCompletedScreen.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DrawCompletedPayloadDTO } from '@/types/raffles/drawEvents.types'
import { WinnerCard } from './WinnerCard'

interface Props {
    payload: DrawCompletedPayloadDTO
    onGoToRaffles: () => void
}

const REDIRECT_SECONDS = 15

export function DrawCompletedScreen({ payload, onGoToRaffles }: Props) {
    const [remaining, setRemaining] = useState(REDIRECT_SECONDS)

    // Countdown de redirección automática
    useEffect(() => {
        const timer = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onGoToRaffles()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [onGoToRaffles])

    const progressPct = ((REDIRECT_SECONDS - remaining) / REDIRECT_SECONDS) * 100

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 text-center w-full max-w-lg"
        >
            {/* Header */}
            <div>
                <motion.p
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400 text-sm uppercase tracking-widest mb-1"
                >
                    Sorteo completado
                </motion.p>
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white"
                >
                    {payload.raffleTitle}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-500 text-sm mt-1"
                >
                    {payload.totalParticipants.toLocaleString()} participantes
                </motion.p>
            </div>

            {/* Lista de ganadores con stagger */}
            <motion.div
                className="w-full space-y-3"
                variants={{
                    show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
                }}
                initial="hidden"
                animate="show"
            >
                {payload.allWinners.map((winner, i) => (
                    <WinnerCard key={winner.ticketNumber} winner={winner} index={i} />
                ))}
            </motion.div>

            {/* Botones */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + payload.allWinners.length * 0.15 }}
                className="flex flex-col sm:flex-row gap-3 w-full"
            >
                <button
                    onClick={onGoToRaffles}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                    Ver más rifas
                </button>

                href={payload.drawProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                <a>
                    Ver prueba del sorteo
                </a>
            </motion.div>

            {/* Barra de redirección automática */}
            <div className="w-full">
                <p className="text-gray-600 text-xs mb-2">
                    Volviendo a rifas en {remaining}s
                </p>
                <div className="w-full bg-white/5 rounded-full h-1">
                    <motion.div
                        className="bg-white/20 h-1 rounded-full"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
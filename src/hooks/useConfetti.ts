// src/hooks/useConfetti.ts
import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {

  const fireWinner = useCallback(() => {
    // Ráfaga desde los dos lados
    const left = () => confetti({
      particleCount: 60,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors: ['#7C3AED', '#A78BFA', '#FFFFFF', '#FCD34D'],
      zIndex: 9999,
    })

    const right = () => confetti({
      particleCount: 60,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors: ['#7C3AED', '#A78BFA', '#FFFFFF', '#FCD34D'],
      zIndex: 9999,
    })

    left()
    right()

    // Segunda ráfaga con delay para más dramatismo
    setTimeout(() => { left(); right() }, 300)
  }, [])

  const fireCompleted = useCallback(() => {
    // Lluvia completa para el sorteo terminado
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.4 },
      colors: ['#7C3AED', '#A78BFA', '#FFFFFF', '#FCD34D', '#34D399'],
      zIndex: 9999,
    })
  }, [])

  return { fireWinner, fireCompleted }
}
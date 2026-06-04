// src/hooks/useConfetti.ts
import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {

  const fireWinner = useCallback(() => {
    const colors = ['#7C3AED', '#A78BFA', '#FFFFFF', '#FCD34D']

    // Lluvia desde la parte superior
    const shower = (x: number) => confetti({
      particleCount: 80,
      spread: 90,
      origin: { x, y: 0 },
      startVelocity: 55,
      gravity: 1.3,
      colors,
      zIndex: 9999,
    })

    shower(0.25)
    shower(0.75)
    setTimeout(() => { shower(0.1); shower(0.5); shower(0.9) }, 350)
    setTimeout(() => { shower(0.4); shower(0.6) }, 700)
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
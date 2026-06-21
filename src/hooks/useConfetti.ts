// src/hooks/useConfetti.ts
import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {

  const fireWinner = useCallback(() => {
    const colors = ['#7C3AED', '#A78BFA', '#FFFFFF', '#FCD34D']

    // Ráfaga desde la parte superior que cae hasta el borde inferior durante ~5 segundos
    const burst = (x: number, n = 55) => confetti({
      particleCount: n,
      spread: 75,
      origin: { x, y: 0 },
      startVelocity: 38,
      gravity: 0.85,
      ticks: 350,     // partículas viven más tiempo para llegar al borde inferior
      colors,
      zIndex: 9999,
    })

    // 5 segundos de lluvia continua en oleadas
    burst(0.25, 70); burst(0.75, 70)
    setTimeout(() => { burst(0.1); burst(0.5); burst(0.9) },  700)
    setTimeout(() => { burst(0.35, 60); burst(0.65, 60) },   1500)
    setTimeout(() => { burst(0.2); burst(0.8) },              2300)
    setTimeout(() => { burst(0.45, 65); burst(0.55, 65) },   3100)
    setTimeout(() => { burst(0.15); burst(0.5); burst(0.85) }, 3900)
    setTimeout(() => { burst(0.3, 60); burst(0.7, 60) },     4700)
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
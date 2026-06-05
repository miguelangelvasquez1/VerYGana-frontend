// src/hooks/useRaffleDraw.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  DrawEventType,
  DrawStatusResponseDTO,
  RaffleDrawEventDTO,
  WaitingRoomPayloadDTO,
  WinnerRevealPayloadDTO,
  DrawCompletedPayloadDTO,
  DrawingStartedPayloadDTO,
} from '@/types/raffles/drawEvents.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const WS_URL  = process.env.NEXT_PUBLIC_WS_URL  ?? 'http://localhost:8080/ws'

// Duración de cada fase del ciclo de revelación por ganador
const REVEALING_DURATION_MS  = 10_000  // ruleta girando
const ANNOUNCING_DURATION_MS =  4_000  // "El Primer Ganador es..."
const WINNER_DISPLAY_MS      = 10_000  // WinnerRevealScreen estático

interface UseRaffleDrawReturn {
  currentPhase: DrawEventType
  isConnected: boolean
  waitingRoom: WaitingRoomPayloadDTO | null
  revealedWinners: WinnerRevealPayloadDTO[]
  totalWinners: number
  drawCompleted: DrawCompletedPayloadDTO | null
  errorMessage: string | null
  announcementLabel: string
  announcementPosition: number
}

function getAnnouncementLabel(position: number): string {
  const ordinals: Record<number, string> = {
    1: 'El Primer Ganador es',
    2: 'El Segundo Ganador es',
    3: 'El Tercer Ganador es',
  }
  return ordinals[position] ?? `El Ganador N° ${position} es`
}

export function useRaffleDraw(raffleId: number): UseRaffleDrawReturn {
  const clientRef = useRef<Client | null>(null)

  // Timer encadenado del ciclo de revelación
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timer para retrasar DRAWING_STARTED hasta que el countdown local llegue a 0
  const drawingStartedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cola: WINNER_REVEALED events que llegan mientras un ciclo está activo
  const pendingWinnersRef   = useRef<WinnerRevealPayloadDTO[]>([])
  // DRAW_COMPLETED recibido mientras el último ciclo aún está corriendo
  const pendingCompletedRef = useRef<DrawCompletedPayloadDTO | null>(null)
  // true mientras un ciclo REVEALING → ANNOUNCING → WINNER_REVEALED → hold está activo
  const inWinnerCycleRef    = useRef(false)

  // Espejo del countdown local (equivalente al setInterval de WaitingRoomScreen)
  const localCountdownRef      = useRef(0)
  const localCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [currentPhase,         setCurrentPhase]         = useState<DrawEventType>(DrawEventType.WAITING_ROOM_UPDATE)
  const [isConnected,          setIsConnected]          = useState(false)
  const [waitingRoom,          setWaitingRoom]          = useState<WaitingRoomPayloadDTO | null>(null)
  const [revealedWinners,      setRevealedWinners]      = useState<WinnerRevealPayloadDTO[]>([])
  const [totalWinners,         setTotalWinners]         = useState(0)
  const [drawCompleted,        setDrawCompleted]        = useState<DrawCompletedPayloadDTO | null>(null)
  const [errorMessage,         setErrorMessage]         = useState<string | null>(null)
  const [announcementLabel,    setAnnouncementLabel]    = useState('')
  const [announcementPosition, setAnnouncementPosition] = useState(1)

  // Ref para llamada recursiva desde dentro del ciclo
  const startWinnerCycleRef = useRef<((w: WinnerRevealPayloadDTO) => void) | null>(null)

  const startWinnerCycle = useCallback((winner: WinnerRevealPayloadDTO) => {
    inWinnerCycleRef.current = true
    setCurrentPhase(DrawEventType.REVEALING)

    // FASE 1 — Ruleta girando (10 s)
    revealTimerRef.current = setTimeout(() => {
      setAnnouncementLabel(getAnnouncementLabel(winner.position))
      setAnnouncementPosition(winner.position)
      setCurrentPhase(DrawEventType.ANNOUNCING)

      // FASE 2 — Anuncio (4 s)
      revealTimerRef.current = setTimeout(() => {
        setRevealedWinners(prev => [...prev, winner])
        setCurrentPhase(DrawEventType.WINNER_REVEALED)

        // FASE 3 — Hold estático (10 s)
        revealTimerRef.current = setTimeout(() => {
          inWinnerCycleRef.current = false

          // ¿Hay ganadores encolados esperando?
          const next = pendingWinnersRef.current.shift()
          if (next) {
            startWinnerCycleRef.current?.(next)
          } else if (pendingCompletedRef.current) {
            setDrawCompleted(pendingCompletedRef.current)
            setCurrentPhase(DrawEventType.DRAW_COMPLETED)
            pendingCompletedRef.current = null
          }
        }, WINNER_DISPLAY_MS)
      }, ANNOUNCING_DURATION_MS)
    }, REVEALING_DURATION_MS)
  }, [])

  // Mantener la ref sincronizada con el callback (que es estable gracias a useCallback([]))
  startWinnerCycleRef.current = startWinnerCycle

  const hydrateInitialState = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/raffles/${raffleId}/draw-status`)
      if (!res.ok) return

      const status: DrawStatusResponseDTO = await res.json()
      setCurrentPhase(status.currentPhase)

      if (status.revealedWinners?.length > 0) {
        setRevealedWinners(status.revealedWinners)
        setTotalWinners(status.totalWinners)
      }

      if (status.currentPhase === DrawEventType.WAITING_ROOM_UPDATE) {
        setWaitingRoom({
          viewerCount:       status.viewerCount,
          secondsUntilDraw:  status.secondsUntilDraw,
          totalTickets:      0,
          totalParticipants: status.totalParticipants ?? 0,
        })
      }
    } catch (err) {
      console.error('[useRaffleDraw] Error hydrating initial state:', err)
    }
  }, [raffleId])

  const handleEvent = useCallback((event: RaffleDrawEventDTO) => {
    switch (event.type) {

      case DrawEventType.WAITING_ROOM_UPDATE: {
        const payload = event.payload as WaitingRoomPayloadDTO

        // Sincronizar el espejo local del countdown con el valor del servidor
        localCountdownRef.current = payload.secondsUntilDraw
        if (localCountdownTimerRef.current) clearInterval(localCountdownTimerRef.current)
        localCountdownTimerRef.current = setInterval(() => {
          localCountdownRef.current = Math.max(0, localCountdownRef.current - 1)
        }, 1000)

        setWaitingRoom(payload)
        setCurrentPhase(DrawEventType.WAITING_ROOM_UPDATE)
        break
      }

      case DrawEventType.DRAWING_STARTED: {
        const data = event.payload as DrawingStartedPayloadDTO
        setTotalWinners(data.totalWinners)

        // Detener el espejo del countdown
        if (localCountdownTimerRef.current) {
          clearInterval(localCountdownTimerRef.current)
          localCountdownTimerRef.current = null
        }

        // Retrasar la transición visual hasta que el countdown local llegue a 0.
        // Esto permite que WaitingRoomScreen muestre "¡Ya!" antes de que empiece el sorteo.
        const delayMs = Math.max(0, localCountdownRef.current * 1000)
        drawingStartedTimerRef.current = setTimeout(() => {
          setCurrentPhase(DrawEventType.DRAWING_STARTED)
          drawingStartedTimerRef.current = null

          // Si WINNER_REVEALED llegó mientras esperábamos al countdown, procesarlo ahora
          const queued = pendingWinnersRef.current.shift()
          if (queued) startWinnerCycleRef.current?.(queued)
        }, delayMs)
        break
      }

      case DrawEventType.WINNER_REVEALED: {
        const winner = event.payload as WinnerRevealPayloadDTO

        if (drawingStartedTimerRef.current) {
          // El delay del countdown sigue pendiente: encolar el ganador sin cancelar el delay.
          // El delay procesará este ganador cuando el "¡Ya!" haya sido visible.
          pendingWinnersRef.current.push(winner)
        } else if (inWinnerCycleRef.current) {
          // Ciclo activo: encolar para procesar después del hold actual
          pendingWinnersRef.current.push(winner)
        } else {
          startWinnerCycleRef.current?.(winner)
        }
        break
      }

      case DrawEventType.DRAW_COMPLETED: {
        const completed = event.payload as DrawCompletedPayloadDTO
        if (inWinnerCycleRef.current) {
          // Encolar: se procesará al final del hold del último ganador
          pendingCompletedRef.current = completed
        } else {
          setDrawCompleted(completed)
          setCurrentPhase(DrawEventType.DRAW_COMPLETED)
        }
        break
      }

      case DrawEventType.DRAW_ERROR:
        setErrorMessage('El sorteo encontró un problema. Por favor recarga la página.')
        setCurrentPhase(DrawEventType.DRAW_ERROR)
        break
    }
  }, [])

  useEffect(() => {
    hydrateInitialState()

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,

      onConnect: () => {
        setIsConnected(true)

        client.subscribe(`/topic/raffle/${raffleId}`, (message) => {
          try {
            const event: RaffleDrawEventDTO = JSON.parse(message.body)
            handleEvent(event)
          } catch (err) {
            console.error('[useRaffleDraw] Error parsing WS message:', err)
          }
        })

        client.publish({
          destination: `/app/raffle/${raffleId}/join`,
          body: JSON.stringify({}),
        })
      },

      onDisconnect: () => setIsConnected(false),

      onStompError: (frame) => {
        console.error('[useRaffleDraw] STOMP error:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (revealTimerRef.current)         clearTimeout(revealTimerRef.current)
      if (drawingStartedTimerRef.current) clearTimeout(drawingStartedTimerRef.current)
      if (localCountdownTimerRef.current) clearInterval(localCountdownTimerRef.current)
      inWinnerCycleRef.current    = false
      pendingCompletedRef.current = null
      pendingWinnersRef.current   = []

      if (client.connected) {
        client.publish({
          destination: `/app/raffle/${raffleId}/leave`,
          body: JSON.stringify({}),
        })
      }
      client.deactivate()
    }
  }, [raffleId, handleEvent, hydrateInitialState])

  return {
    currentPhase,
    isConnected,
    waitingRoom,
    revealedWinners,
    totalWinners,
    drawCompleted,
    errorMessage,
    announcementLabel,
    announcementPosition,
  }
}

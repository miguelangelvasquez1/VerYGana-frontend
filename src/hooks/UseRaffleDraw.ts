// src/hooks/useRaffleDraw.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
import { Console } from 'console'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const WS_URL  = process.env.NEXT_PUBLIC_WS_URL  ?? 'http://localhost:8080/ws'

interface UseRaffleDrawReturn {
  currentPhase:    DrawEventType
  isConnected:     boolean
  waitingRoom:     WaitingRoomPayloadDTO | null
  revealedWinners: WinnerRevealPayloadDTO[]
  totalWinners:    number
  drawCompleted:   DrawCompletedPayloadDTO | null
  errorMessage:    string | null
}

export function useRaffleDraw(raffleId: number): UseRaffleDrawReturn {
  const clientRef = useRef<Client | null>(null)

  const [currentPhase, setCurrentPhase] = useState<DrawEventType>(
    DrawEventType.WAITING_ROOM_UPDATE
  )
  const [isConnected,     setIsConnected]     = useState(false)
  const [waitingRoom,     setWaitingRoom]     = useState<WaitingRoomPayloadDTO | null>(null)
  const [revealedWinners, setRevealedWinners] = useState<WinnerRevealPayloadDTO[]>([])
  const [totalWinners,    setTotalWinners]    = useState(0)
  const [drawCompleted,   setDrawCompleted]   = useState<DrawCompletedPayloadDTO | null>(null)
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null)

  // Hidrata el estado inicial desde el endpoint REST antes de conectar WS
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
          viewerCount:      status.viewerCount,
          secondsUntilDraw: status.secondsUntilDraw,
          totalTickets:     0,
        })
      }
    } catch (err) {
      console.error('[useRaffleDraw] Error hydrating initial state:', err)
    }
  }, [raffleId])

  // Procesa cada evento que llega por WebSocket
  const handleEvent = useCallback((event: RaffleDrawEventDTO) => {
    switch (event.type) {

      case DrawEventType.WAITING_ROOM_UPDATE:
        setWaitingRoom(event.payload as WaitingRoomPayloadDTO)
        setCurrentPhase(DrawEventType.WAITING_ROOM_UPDATE)
        console.log('[WS] EVENT:', event)
        break

      case DrawEventType.DRAWING_STARTED:
        const data = event.payload as DrawingStartedPayloadDTO
        setCurrentPhase(DrawEventType.DRAWING_STARTED)
        setTotalWinners(data.totalWinners)
        console.log('[WS] EVENT:', event)
        break

      case DrawEventType.WINNER_REVEALED: {
        const winner = event.payload as WinnerRevealPayloadDTO
        setRevealedWinners(prev => [...prev, winner])
        setTotalWinners(winner.totalWinners)
        setCurrentPhase(DrawEventType.WINNER_REVEALED)
        console.log('[WS] EVENT:', event)
        break
      }

      case DrawEventType.DRAW_COMPLETED:
        setDrawCompleted(event.payload as DrawCompletedPayloadDTO)
        setCurrentPhase(DrawEventType.DRAW_COMPLETED)
        console.log('[WS] EVENT:', event)
        break

      case DrawEventType.DRAW_ERROR:
        setErrorMessage('El sorteo encontró un problema. Por favor recarga la página.')
        setCurrentPhase(DrawEventType.DRAW_ERROR)
        console.log('[WS] EVENT:', event)
        break
    }
  }, [])

  useEffect(() => {
    hydrateInitialState()

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),

      // Reconexión automática cada 5 segundos si se cae la conexión
      reconnectDelay: 5000,

      onConnect: () => {
        setIsConnected(true)
        console.log('[WS] Conectado')

        // Suscribirse al canal de esta rifa
        client.subscribe(`/topic/raffle/${raffleId}`, (message) => {
          try {
            const event: RaffleDrawEventDTO = JSON.parse(message.body)
            handleEvent(event)
          } catch (err) {
            console.error('[useRaffleDraw] Error parsing WS message:', err)
          }
        })

        // Registrarse en la sala de espera para aparecer en el viewer count
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
      // Avisar al servidor que el usuario salió antes de desconectar
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
  }
}
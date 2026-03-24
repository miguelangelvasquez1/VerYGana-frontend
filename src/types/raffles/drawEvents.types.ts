import { PrizeType } from "./prize.types"

export enum DrawEventType {
  WAITING_ROOM_UPDATE = 'WAITING_ROOM_UPDATE',
  DRAWING_STARTED     = 'DRAWING_STARTED',
  WINNER_REVEALED     = 'WINNER_REVEALED',
  DRAW_COMPLETED      = 'DRAW_COMPLETED',
  DRAW_ERROR          = 'DRAW_ERROR',
}

export interface WaitingRoomPayloadDTO {
  viewerCount: number
  secondsUntilDraw: number
  totalTickets: number
}

export interface WinnerRevealPayloadDTO {
  position: number
  ticketNumber: string
  userName: string
  prizeTitle: string
  prizeValue: number
  prizeType: PrizeType
  revealOrder: number
  totalWinners: number
}

export interface DrawCompletedPayloadDTO {
  raffleTitle: string
  allWinners: WinnerRevealPayloadDTO[]
  drawProofUrl: string
  totalParticipants: number
}

export interface DrawingStartedPayloadDTO {
  totalTickets: number
  totalWinners: number
}

export interface RaffleDrawEventDTO {
  type: DrawEventType
  raffleId: number
  timestamp: string
  payload: WaitingRoomPayloadDTO | DrawingStartedPayloadDTO | WinnerRevealPayloadDTO | DrawCompletedPayloadDTO | null
}

export interface DrawStatusResponseDTO {
  currentPhase: DrawEventType
  secondsUntilDraw: number
  viewerCount: number
  revealedWinners: WinnerRevealPayloadDTO[]
  totalWinners: number
  drawProofUrl: string | null
  asOf: string
}


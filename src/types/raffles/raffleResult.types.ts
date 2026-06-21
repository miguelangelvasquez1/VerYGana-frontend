import { WinnerDetailResponseDTO } from "./raffleWinner.types";
import { PrizeType } from "./prize.types"

export interface RaffleResultResponseDTO {
    raffleId: number;
    raffleTitle: string;
    raffleImageUrl: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    drawnAt: string;
    totalParticipants: number;
    totalTicketsIssued: number;
    winners: WinnerDetailResponseDTO[];
}

export interface RaffleSummaryResultResponseDTO {
    raffleId: number;
    raffleTitle: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    drawnAt: string;
}

export interface RandomOrgDrawMetadata {
  serialNumber: number
  completionTime: string
  bitsUsed: number
  bitsLeft: number
  signature: string
  hashedApiKey: string
  license: object
}

export interface WinnerProofResponseDTO {
  userName: string
  ticketNumber: string
  position: number
  prizeTitle: string
  prizeType: PrizeType
  prizeValue: number
  prizeClaimed: boolean
  claimDeadline: string
  prizeClaimedAt: string | null
  prizeTrackingInfo: string | null
}

export interface DrawProofResponseDTO {
  raffleId: number
  raffleTitle: string
  configuredDrawMethod: string
  actualDrawMethod: string
  drawMethodNote: string
  randomOrgDrawMetadata: RandomOrgDrawMetadata
  drawDate: string
  executedAt: string
  totalParticipants: number
  totalTickets: number
  ticketPoolHash: string
  numberOfWinners: number
  winners: WinnerProofResponseDTO[]
}
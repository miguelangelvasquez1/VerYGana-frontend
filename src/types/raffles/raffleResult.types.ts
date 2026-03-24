import { WinnerDetailResponseDTO } from "./raffleWinner.types";

export interface RaffleResultResponseDTO {
    raffleId: number;
    raffleTitle: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    drawnAt: string;
    drawProof: string;
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

export interface RaffleTicketResponseDTO {
    id: number;
    raffleTicketStatus : 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    ticketNumber: string;
    source : 'PURCHASE' | 'GAME_ACHIEVEMENT' | 'ADS_WATCHED' | 'REFERRAL';
    sourceId: number;
    raffleId: number;
    issuedAt: string;
    usedAt: string | null;
}

export interface TicketBalanceResponseDTO {
    raffleId: number;
    raffleTitle: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    ticketsCount: number;
    drawDate: string;
    raffleStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'COMPLETED' | 'CANCELLED';
}
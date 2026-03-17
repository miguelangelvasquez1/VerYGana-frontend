export interface WinnerSummaryResponseDTO {
    winnerId: number;
    consumerId: number;
    consumerName: string;
    ticketNumber: string;
    prizeTitle: string;
    position: number;
}

export interface PrizeWonResponseDTO {
    prizeId: number;
    winnerId: number;
    title: string;
    description: string;
    brand: string;
    value: number;
    imageUrl: string;
    prizeType: 'PHYSICAL' | 'DIGITAL' | 'CASH' | 'VOUCHER' | 'SERVICE';
    position: number;
    quantity: number;
    ticketWinnerNumber: string;
    drawnAt: string;
    isClaimed: boolean;
    claimedAt: string | null;
}
export interface WinnerSummaryResponseDTO {
    userName: string;
    raffleTitle: string;
    prizeTitle: string;
    prizeValue: number;
    position: number;
}

export interface WinnerDetailResponseDTO {
    userName: string;
    ticketNumber: string;
    prizeTitle: string;
    prizeImageUrl: string;
    prizeType: 'PHYSICAL' | 'DIGITAL';
    prizeValue: number;
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
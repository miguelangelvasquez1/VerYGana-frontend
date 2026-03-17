
export interface CreateTicketEarningRuleRequestDTO {
    ruleName: string;
    description: string;
    ruleType : 'PURCHASE' | 'ADS_WATCHED'| 'GAME_ACHIEVEMENT' | 'REFERRAL';
    priority: number;
    minPurchaseAmount?: number;
    minAdsWatched?: number;
    achievementType?: string;
    referralAddedQuantity?: number;
    ticketsToAward: number;
}

export interface UpdateTicketEarningRuleRequestDTO {
    ruleName: string;
    description: string;
    ruleType : 'PURCHASE' | 'ADS_WATCHED'| 'GAME_ACHIEVEMENT' | 'REFERRAL';
    priority: number;
    ticketsToAward: number;
    minPurchaseAmount?: number;
    minAdsWatched?: number;
    achievementType?: string;
    referralAddedQuantity?: number;
}

export interface TicketEarningRuleResponseDTO {
    id: number;
    ruleName: string;
    description: string;
    ruleType : 'PURCHASE' | 'ADS_WATCHED'| 'GAME_ACHIEVEMENT' | 'REFERRAL';
    isActive: boolean;
    priority: number;
    ticketsToAward: number;
    minPurchaseAmount: number | null;
    minAdsWatched: number | null;
    achievementType: string | null;
    referralAddedQuantity: number | null;
    createdAt: string;
    updatedAt: string;
}
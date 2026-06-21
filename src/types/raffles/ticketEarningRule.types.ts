export enum TicketEarningRuleType {
    PURCHASE = "PURCHASE",
    DAILY_LOGIN = "DAILY_LOGIN",
    REFERRAL = "REFERRAL"
}   

export interface CreateTicketEarningRuleRequestDTO {
    ruleName: string;
    description: string;
    ruleType: TicketEarningRuleType;
    priority: number;
    minPurchaseAmount?: number;
    dailyLogin?: boolean;
    referralAddedQuantity?: number;
    ticketsToAward: number;
}

export interface UpdateTicketEarningRuleRequestDTO {
    ruleName: string;
    description: string;
    ruleType: TicketEarningRuleType;
    priority: number;
    ticketsToAward: number;
    minPurchaseAmount?: number;
    dailyLogin?: boolean;
    referralAddedQuantity?: number;
}

export interface TicketEarningRuleResponseDTO {
    id: number;
    ruleName: string;
    description: string;
    ruleType : TicketEarningRuleType;
    isActive: boolean;
    priority: number;
    ticketsToAward: number;
    minPurchaseAmount: number | null;
    dailyLogin: boolean | null;
    referralAddedQuantity: number | null;
    createdAt: string;
    updatedAt: string;
}
import { TicketEarningRuleResponseDTO } from "./ticketEarningRule.types";
export interface CreateRaffleRuleRequestDTO {
    ticketEarningRuleId : number;
    maxTicketsBySource : number;
}

export interface RaffleRuleResponseDTO {
    id: number;
    raffleId: number;
    isActive: boolean;
    ticketEarningRuleResponseDTO: TicketEarningRuleResponseDTO;
    maxTicketsBySource: number;
    currentTicketsBySource: number;
    createdAt: string;
    updatedAt: string;
}
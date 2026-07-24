export enum AuditAction {
    ISSUED = "ISSUED",
    EXPIRED = "EXPIRED",
    WON = "WON",
    CANCELLED = "CANCELLED",
    TRANSFERRED = "TRANSFERRED"
}

export enum RaffleTicketSource {
    PURCHASE = "PURCHASE",
    DAILY_LOGIN = "DAILY_LOGIN",
    REFERRAL = "REFERRAL"
}

export interface TicketAuditLogResponseDTO {
    id: number;
    ticketId: number;
    action: AuditAction;
    sourceType: RaffleTicketSource;
    sourceId: number;
    ipAddress: string;
    metadata: string;
    createdAt: string;
}

export interface SuspiciousIpActivityResponseDTO {
    ipAddress: string;
    ticketCount: number;
}
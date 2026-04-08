import apiClient from "@/lib/api/client";
import { EntityCreatedResponseDTO, EntityUpdatedResponseDTO, PagedResponse } from "@/types/Generic.types";
import { ConfirmRaffleCreationRequestDTO, CreateRaffleRequestDTO, DrawResultResponseDTO, PrepareRaffleCreationRequestBodyDTO, PrepareRaffleCreationResponseDTO, RaffleResponseDTO, RaffleSummaryResponseDTO, UpdateRaffleRequestDTO } from "@/types/raffles/raffle.types";
import { RaffleTicketResponseDTO } from "@/types/raffles/raffleTicket.types";
import { CreateTicketEarningRuleRequestDTO, TicketEarningRuleResponseDTO, UpdateTicketEarningRuleRequestDTO } from "@/types/raffles/ticketEarningRule.types";

// AdminTicketController

export const getTicketsByRaffle = async (raffleId: number, status: string, source: string, issuedAt: string, size?: 20, page?: 0): Promise<RaffleTicketResponseDTO> => {
    const response = await apiClient.get(`/api/admin/tickets/raffle/${raffleId}`, {
        params: {
            status,
            source,
            issuedAt,
            size,
            page
        }
    });
    return response.data;
}

export const validateTicket = async (ticketNumber: string): Promise<boolean> => {
    const response = await apiClient.get(`/api/admin/tickets/${ticketNumber}/validate`);
    return response.data;
}

export const expireTickets = async (raffleId: number): Promise<void> => {
    const response = await apiClient.post(`/api/admin/tickets/raffle/${raffleId}/expire`);
    return response.data;
}

// RaffleAdminController

export const prepareRaffleCreation = async (request: PrepareRaffleCreationRequestBodyDTO): Promise<PrepareRaffleCreationResponseDTO> => {
    const response = await apiClient.post("/api/admin/raffles/prepare", request);
    return response.data;
}

export const confirmRaffleCreation = async (request: ConfirmRaffleCreationRequestDTO): Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post("/api/admin/raffles/confirm", request);
    return response.data;
}

export const updateRaffle = async (raffleId: number, raffle: UpdateRaffleRequestDTO): Promise<EntityUpdatedResponseDTO> => {
    const response = await apiClient.put(`/api/admin/raffles/${raffleId}`, raffle);
    return response.data;
}

export const activateRaffle = async (raffleId: number): Promise<void> => {
    await apiClient.patch(`/api/admin/raffles/${raffleId}/activate`);
}

export const closeRaffle = async (raffleId: number): Promise<void> => {
    await apiClient.patch(`/api/admin/raffles/${raffleId}/close`);
}

export const cancelRaffle = async (raffleId: number): Promise<void> => {
    await apiClient.patch(`/api/admin/raffles/${raffleId}/cancel`);
}

export const deleteRaffle = async (raffleId: number): Promise<void> => {
    await apiClient.delete(`/api/admin/raffles/${raffleId}`);
}

export const getRaffleById = async (raffleId: number): Promise<RaffleResponseDTO> => {
    const response = await apiClient.get(`/api/admin/raffles/${raffleId}`);
    return response.data;
}

export const conductDraw = async (raffleId: number): Promise<DrawResultResponseDTO> => {
    const response = await apiClient.post(`/api/admin/raffles/${raffleId}/draw`);
    return response.data;
}

export const verifyDrawIntegrity = async (raffleId: number): Promise<boolean> => {
    const response = await apiClient.get(`/api/admin/raffles/${raffleId}/verify`);
    return response.data;
}

export const countRafflesByStatus = async (status: string): Promise<number> => {
    const response = await apiClient.get("/api/admin/raffles/count", {
        params: {
            status
        }
    });
    return response.data;
}

// TicketEarningRuleController

export const createTicketEarningRule = async (ticketEarningRule: CreateTicketEarningRuleRequestDTO): Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post("/api/admin/ticket-rules", ticketEarningRule);
    return response.data;
}

export const updateTicketEarningRule = async (ruleId: number, ticketEarningRule: UpdateTicketEarningRuleRequestDTO): Promise<EntityUpdatedResponseDTO> => {
    const response = await apiClient.put(`/api/admin/ticket-rules/${ruleId}`, ticketEarningRule);
    return response.data;
}

export const deleteTicketEarningRule = async (ruleId: number): Promise<void> => {
    await apiClient.delete(`/api/admin/ticket-rules/${ruleId}`);
}

export const getTicketEarningRulesList = async (type?: string, isActive?: boolean, size?: number, page?: number): Promise<TicketEarningRuleResponseDTO[]> => {
    const response = await apiClient.get("/api/admin/ticket-rules", {
        params: {
            type,
            isActive,
            size,
            page
        }
    });
    return response.data;
}

export const getTicketEarningRule = async (ruleId: number): Promise<TicketEarningRuleResponseDTO> => {
    const response = await apiClient.get(`/api/admin/ticket-rules/${ruleId}`);
    return response.data;
}

export const activeTicketEarningRule = async (ruleId: number): Promise<void> => {
    await apiClient.patch(`/api/admin/ticket-rules/${ruleId}/activate`);
}

export const deactivateTicketEarningRule = async (ruleId: number): Promise<void> => {
    await apiClient.patch(`/api/admin/ticket-rules/${ruleId}/deactivate`);
}

export const countActiveTicketEarningRules = async (): Promise<number> => {
    const response = await apiClient.get("/api/admin/ticket-rules/count/active");
    return response.data;
}
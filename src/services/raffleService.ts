import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/GenericTypes";
import { ParticipantLeaderboardDTO, RaffleResponseDTO, RaffleStatsResponseDTO, RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { RaffleTicketResponseDTO } from "@/types/raffles/raffleTicket.types";
import { PrizeWonResponseDTO, WinnerSummaryResponseDTO } from "@/types/raffles/raffleWinner.types";

// RaffleController
export const getRafflesByStatusAndType = async (status?: string, type?: string, size?: number, page?: number): Promise<PagedResponse<RaffleSummaryResponseDTO>> => {
    const response = await apiClient.get("/api/raffles", {
        params: {
            status,
            type,
            size,
            page
        }
    });
    return response.data;
}

export const getRaffleById = async (raffleId: number): Promise<RaffleResponseDTO> => {
    const response = await apiClient.get(`/api/raffles/${raffleId}`);
    return response.data;
}

export const getRaffleStats = async (raffleId: number): Promise<RaffleStatsResponseDTO> => {
    const response = await apiClient.get(`/api/raffles/${raffleId}/stats`);
    return response.data;
}

export const getRaffleLeaderBoard = async (raffleId: number): Promise<ParticipantLeaderboardDTO[]> => {
    const response = await apiClient.get(`/api/raffles/${raffleId}/leaderboard`);
    return response.data;
}

// RaffleWinnerController

export const getRaffleWinners = async (raffleId: number): Promise<WinnerSummaryResponseDTO[]> => {
    const response = await apiClient.get(`/api/winners/raffle/${raffleId}`);
    return response.data;
}

export const getWonPrizes = async (size?: 10, page?: 0): Promise<PagedResponse<PrizeWonResponseDTO>> => {
    const response = await apiClient.get("/api/winners/my-prizes", {
        params: {
            size,
            page
        }
    });
    return response.data;
}

// Aqui va el metodo de reclamar premio (aun no hecho)

// UserRaffleTicketController

export const getUserTickets = async (status?: string, source?: string, issuedAt?: string, size?: number, page?: number): Promise<PagedResponse<RaffleTicketResponseDTO>> => {
    const response = await apiClient.get("/api/my/raffle-tickets", {
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

export const getUserTotalTickets = async (status?: string): Promise<number> => {
    const response = await apiClient.get("/api/my/raffle-tickets/balance", {
        params: {
            status
        }
    });
    return response.data;
}

export const getUserTicketBalanceByRaffle = async (): Promise<number> => {
    const response = await apiClient.get("/api/my/raffle-tickets/balance/by-raffle");
    return response.data;
}

export const getUserTicketBalanceInRaffle = async (raffleId: number, status?: string): Promise<number> => {
    const response = await apiClient.get(`/api/my/raffle-tickets/balance/raffle/${raffleId}`, {
        params: {
            status
        }
    });
    return response.data;
}

export const canUserReceiveTickets = async (raffleType: string): Promise<boolean> => {
    const response = await apiClient.get(`/api/my/raffle-tickets/eligibility/${raffleType}`);
    return response.data;
}
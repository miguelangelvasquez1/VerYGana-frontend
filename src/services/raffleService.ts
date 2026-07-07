import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { PrizeStatus } from "@/types/raffles/prize.types";
import { ParticipantLeaderboardDTO, RaffleResponseDTO, RaffleStatsResponseDTO, RaffleStatus, RaffleSummaryResponseDTO, UserRaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { DrawProofResponseDTO, RaffleResultResponseDTO, RaffleSummaryResultResponseDTO } from "@/types/raffles/raffleResult.types";
import { RaffleTicketResponseDTO } from "@/types/raffles/raffleTicket.types";
import { ClaimPrizeRequestDTO, PrizeWonResponseDTO, WinnerSummaryResponseDTO } from "@/types/raffles/raffleWinner.types";

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

export const getLiveRaffles = async (): Promise<RaffleSummaryResponseDTO[]> => {
    const response = await apiClient.get("/api/raffles/lives");
    return response.data;
}

export const getActiveRaffles = async (type: string, pageNumber: number): Promise<PagedResponse<RaffleSummaryResponseDTO>> => {
    const response = await apiClient.get("/api/raffles/actives", {
        params: {
            type,
            pageNumber
        }
    });
    return response.data;
}

export const getMyRafflesByStatus = async (status : RaffleStatus , size : number, page: number): Promise<PagedResponse<UserRaffleSummaryResponseDTO>> => {
    const response = await apiClient.get("/api/raffles/me", {
        params: {
            status,
            size,
            page
        }
    });
    return response.data;
}

export const countMyRafflesByStatus = async (status : RaffleStatus): Promise<number> => {
    const response = await apiClient.get("/api/raffles/me/count", {
        params: {
            status
        }
    });
    return response.data;
}

// RaffleWinnerController

export const getRaffleWinners = async (raffleId: number): Promise<WinnerSummaryResponseDTO[]> => {
    const response = await apiClient.get(`/winners/raffle/${raffleId}`);
    return response.data;
}

export const getWonPrizes = async (size?: 10, page?: 0, status?: PrizeStatus | null): Promise<PagedResponse<PrizeWonResponseDTO>> => {
    const response = await apiClient.get("/winners/my-prizes", {
        params: {
            size,
            page,
            status
        }
    });
    return response.data;
}

export const getLastWinners = async (): Promise<WinnerSummaryResponseDTO[]> => {
    const response = await apiClient.get("/winners/last");
    return response.data;
}

export const sendClaimPhoneOtp = async (phoneNumber: string): Promise<void> => {
    const response = await apiClient.post("/winners/claim/send-otp", null, {params: {
        phoneNumber
    }});
    return response.data;
}

export const claimPrize = async (claimData: ClaimPrizeRequestDTO): Promise<void> => {
    const response = await apiClient.post("/winners/claim", claimData);
    return response.data;
}

// UserRaffleTicketController

export const getUserTicketsByRaffle = async (raffleId: number, size?: number, page?: number): Promise<PagedResponse<RaffleTicketResponseDTO>> => {
    const response = await apiClient.get(`/api/my/raffle-tickets/raffle/${raffleId}`, {
        params: {
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

// RaffleResultController

export const getRaffleResultByRaffleId = async (raffleId: number): Promise<RaffleResultResponseDTO> => {
    const response = await apiClient.get(`results/raffle/${raffleId}`);
    return response.data;
}

export const getLastRafflesResults = async (): Promise<RaffleSummaryResultResponseDTO[]> => {
    const response = await apiClient.get("results/last");
    return response.data;
}

export const getDrawProofByRaffleId = async (raffleId: number): Promise<DrawProofResponseDTO> => {
    const response = await apiClient.get(`results/raffle/${raffleId}/draw-proof`);
    return response.data;
}
import apiClient from "@/lib/api/client"
import { PagedResponse } from "@/types/common";
import { EndSessionDTO, GameCardResponseDTO, GameEventDTO, GameMetricDTO, InitGameRequestDTO, InitGameResponseDTO } from "@/types/games/game.types"

export const init = async (request: InitGameRequestDTO): Promise<InitGameResponseDTO> => {
    const response = await apiClient.post('/games/init', request);
    return response.data;
}

export const submitGameMetrics = async(event : GameEventDTO<GameMetricDTO[]>): Promise<void> => {
    const response = await apiClient.post('/games/metrics', event);
    return response.data;
}

export const endSession = async (event: GameEventDTO<EndSessionDTO>): Promise<void> => {
    const response = await apiClient.post('/games/end-session', event);
    return response.data;
}

export const getAvailableGamesPage = async(page = 0, size = 10): Promise<PagedResponse<GameCardResponseDTO>> => {
    const response = await apiClient.get('/games', {params: {page, size}});
    return response.data;
}
import apiClient from '@/lib/api/client';
import { Game } from '@/types/games/campaigns';
import { PagedResponse } from '@/types/Generic.types';

/**
 * Game Schema API Client
 * Fetches JSON Schema and UI Schema for games
 */

export interface GameSchemaResponse {
  gameId: number;
  gameName: string;
  version: string;
  jsonSchema: any;
  uiSchema?: any;
}

/**
 * Get JSON Schema for a game
 */
async function getGameSchema(gameId: number): Promise<GameSchemaResponse> {
  const response = await apiClient.get<GameSchemaResponse>(
    `/games/${gameId}/schema`
  );

  return response.data;
}

/**
 * Get UI Schema for a game (optional)
 */
// async function getGameUiSchema(gameId: number): Promise<any> {
//   try {
//     const response = await apiClient.get<any>(
//       `/games/${gameId}/ui-schema`
//     );

//     return response.data;
//   } catch (error: any) {
//     // UI Schema is optional
//     if (error.response?.status === 404) {
//       return null;
//     }
//     throw error;
//   }
// }

/**
 * List all available games
 */
async function listGames(): Promise<{
    content: Game[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
  const response = await apiClient.get<
    PagedResponse<Game>
  >('/games');

  return {
      content: response.data.data,
      totalElements: response.data.meta.totalElements,
      totalPages: response.data.meta.totalPages,
      currentPage: response.data.meta.page,
    };
}

export const gamesApi = {
  getGameSchema,
  // getGameUiSchema,
  listGames
};

export interface StartGameSessionResponseDTO {
    sessionId: string;
    sessionToken: string;
    webgUrl: string;
    gameCode: string;
    campaignId?: number;
}
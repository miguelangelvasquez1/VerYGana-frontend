import { CreatePrizeRequestDTO, PrizeResponseDTO, PrizeUploadSlotDTO } from "./prize.types";
import { CreateRaffleRuleRequestDTO, RaffleRuleResponseDTO } from "./raffleRule.types";
import { WinnerSummaryResponseDTO } from "./raffleWinner.types";
import { FileUploadPermissionDTO, FileUploadRequestDTO } from "../GenericTypes";

export interface PrepareRaffleCreationResponseDTO {
    raffleAssetId : number;
    raffleImagePermission : FileUploadPermissionDTO;
    prizeUploadSlots: PrizeUploadSlotDTO[];
}

export interface PrepareRaffleCreationRequestBodyDTO {
    raffleData : CreateRaffleRequestDTO;
    raffleImageMetadata : FileUploadRequestDTO;
    prizeImageMetadataList : FileUploadRequestDTO[];
}

export interface ConfirmRaffleCreationRequestDTO {
    raffleAssetId : number;
    prizeAssetIds : number[];
    raffleData : CreateRaffleRequestDTO;
}

export interface CreateRaffleRequestDTO {
    title: string;
    description: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    startDate: string;
    endDate: string;
    drawDate: string;
    maxTotalTickets: number;
    maxTicketsPerUser: number;
    requiresPet: boolean;
    drawMethod: 'RANDOM_ORG' | 'SYSTEM_RANDOM';
    prizes: CreatePrizeRequestDTO[];
    rules: CreateRaffleRuleRequestDTO[];
    termsAndConditions: string;
}

export interface UpdateRaffleRequestDTO {
    title: string;
    description: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    requiresPet: boolean;
    startDate: string;
    endDate: string;
    drawDate: string;
}

export interface RaffleSummaryResponseDTO {
    id: number;
    title: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    raffleStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    drawDate: string;
    totalTicketsIssued: number;
    totalParticipants: number;
    prizeCount: number;
    requiresPet: boolean;
}

export interface RaffleResponseDTO {
    id: number;
    imageUrl: string;
    title: string;
    description: string;
    raffleType: 'PREMIUM' | 'STANDARD';
    raffleStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    drawDate: string;
    maxTicketsPerUser: number;
    maxTotalTickets: number;
    totalTicketsIssued: number;
    totalParticipants: number;
    prizes: PrizeResponseDTO[];
    rules: RaffleRuleResponseDTO[];
    requiresPet: boolean;
    drawMethod: 'RANDOM_ORG' | 'SYSTEM_RANDOM';
    termsAndConditions: string;
}

export interface DrawResultResponseDTO {
    raffleId: number;
    numberOfWinners: number;
    winners: WinnerSummaryResponseDTO[];
    message: string;
}

export interface RaffleStatsResponseDTO {
    id: number;
    maxTicketsFromPurchases: number;
    maxTicketsFromAds: number;
    maxTicketsFromGames: number;
    maxTicketsFromReferrals: number;
    totalPrizesValue: number;
    ticketsBySource: Map<string, number>;
}

export interface ParticipantLeaderboardDTO {
    consumerId: number;
    userName: string;
    avatarUrl: string;
    ticketsCount: number;
    winProbability: number;
}
import { CreatePrizeRequestDTO, PrizeResponseDTO, PrizeUploadSlotDTO } from "./prize.types";
import { CreateRaffleRuleRequestDTO, RaffleRuleResponseDTO } from "./raffleRule.types";
import { WinnerSummaryResponseDTO } from "./raffleWinner.types";
import { FileUploadPermissionDTO, FileUploadRequestDTO } from "../Generic.types";

export enum RaffleType {
    PREMIUM = 'PREMIUM',
    STANDARD = 'STANDARD'
}

export enum RaffleStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    DRAWING = 'DRAWING',
    LIVE = 'LIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum DrawMethod {
    RANDOM_ORG = 'RANDOM_ORG',
    SYSTEM_RANDOM = 'SYSTEM_RANDOM'
}

export interface PrepareRaffleCreationResponseDTO {
    raffleAssetId: number;
    raffleImagePermission: FileUploadPermissionDTO;
    prizeUploadSlots: PrizeUploadSlotDTO[];
}

export interface PrepareRaffleCreationRequestBodyDTO {
    raffleData: CreateRaffleRequestDTO;
    raffleImageMetadata: FileUploadRequestDTO;
    prizeImageMetadataList: FileUploadRequestDTO[];
}

export interface ConfirmRaffleCreationRequestDTO {
    raffleAssetId: number;
    prizeAssetIds: number[];
    raffleData: CreateRaffleRequestDTO;
}

export interface CreateRaffleRequestDTO {
    title: string;
    description: string;
    raffleType: RaffleType
    startDate: string;
    endDate: string;
    drawDate: string;
    maxTotalTickets: number;
    maxTicketsPerUser: number;
    requiresPet: boolean;
    drawMethod: DrawMethod
    prizes: CreatePrizeRequestDTO[];
    rules: CreateRaffleRuleRequestDTO[];
    termsAndConditions: string;
}

export interface UpdateRaffleRequestDTO {
    title: string;
    description: string;
    raffleType: RaffleType
    requiresPet: boolean;
    startDate: string;
    endDate: string;
    drawDate: string;
}

export interface RaffleSummaryResponseDTO {
    id: number;
    title: string;
    imageUrl: string;
    raffleType: RaffleType
    raffleStatus: RaffleStatus
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
    raffleType: RaffleType
    raffleStatus: RaffleStatus
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
    drawMethod: DrawMethod
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

export interface UserRaffleSummaryResponseDTO {
    id: number;
    title: string;
    imageUrl: string;
    raffleType: RaffleType;
    raffleStatus: RaffleStatus;
    drawDate: string;
    userTicketCount: number;
    isWinner: boolean;
}
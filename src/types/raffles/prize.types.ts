import { FileUploadPermissionDTO } from "../Generic.types";

export enum PrizeType {
    PHYSICAL = 'PHYSICAL',
    DIGITAL = 'DIGITAL'
}

export enum PrizeStatus {
    PENDING = 'PENDING',
    DELIVERED = 'DELIVERED',
    EXPIRED = 'EXPIRED'
}

export interface CreatePrizeRequestDTO {
    title: string;
    description: string;
    brand: string;
    value: number;
    prizeType: PrizeType;
    position: number;
    quantity: number;
    claimCode: string;
    claimInstructions: string;
}

export interface PrizeUploadSlotDTO {
    prizeIndex : number;
    prizeAssetId : number;
    permission : FileUploadPermissionDTO
}

export interface PrizeResponseDTO {
    id: number;
    title: string;
    description: string;
    brand: string;
    value: number;
    imageUrl: string;
    prizeType: PrizeType;
    position: number;
    quantity: number;
}
import { FileUploadPermissionDTO } from "../GenericTypes";

export enum PrizeType {
    PHYSICAL = 'PHYSICAL',
    DIGITAL = 'DIGITAL'
}

export interface CreatePrizeRequestDTO {
    title: string;
    description: string;
    brand: string;
    value: number;
    prizeType: PrizeType;
    position: number;
    quantity: number;
    requiresShipping: boolean;
    estimatedDeliveryDays?: number | null;
    redemptionInstructions?: string;
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
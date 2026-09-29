import { FileUploadPermissionDTO } from "./Generic.types";
import { ProductType } from "./products/Product.types";

export enum PqrsType {
    PETICION = 'PETICION',
    QUEJA = 'QUEJA',
    RECLAMO = 'RECLAMO',
    SUGERENCIA = 'SUGERENCIA'
}

export enum PqrsStatus {
    PENDIENTE_ASIGNACION = 'PENDIENTE_ASIGNACION',
    RECIBIDA = 'RECIBIDA',
    EN_REVISION = 'EN_REVISION',
    PENDIENTE_PAGO_REEMBOLSO = 'PENDIENTE_PAGO_REEMBOLSO',
    RESUELTA = 'RESUELTA',
    CERRADA = 'CERRADA'
}

export enum MarketPlaceIssueReason {
    CODE_INVALID = 'CODE_INVALID',
    NOT_DELIVERED = 'NOT_DELIVERED',
    NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
    OTHER = 'OTHER'
}

export enum PqrsResolutionAction {
    DISMISS = 'DISMISS',
    REFUND = 'REFUND'
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}

export enum SupportedMimeType {
    IMAGE_PNG = 'IMAGE_PNG',
    IMAGE_JPEG = 'IMAGE_JPEG',
    IMAGE_JPG = 'IMAGE_JPG',
    IMAGE_WEBP = 'IMAGE_WEBP',
    VIDEO_MP4 = 'VIDEO_MP4',
    VIDEO_QUICK_TIME = 'VIDEO_QUICK_TIME'
}

export interface PqrsProductContextDTO {
    id : number;
    name : string;
    description : string;
    categoryName : string;
    priceCents : number;
    productType : ProductType;
    imageUrl : string;
    averageRate : number;
    reviewCount : number;
}

export interface PqrsCommercialContextDTO {
    commercialUserId : number;
    companyName : string;
    nit : string;
    municipalityName : string;
    departmentName : string;
    contactEmail : string;
    contactPhone : string;
    currentPlanName : string;
}

export interface PreparePqrsAssetRequestDTO {
    originalFileName : string;
    contentType : string;
    sizeBytes : number;
}

export interface PqrsAssetUploadPermissionDTO {
    assetId : number;
    permission : FileUploadPermissionDTO;
}

export interface PqrsAssetResponseDTO {
    id : number;
    originalFileName: string;
    mediaType : MediaType;
    mimeType : SupportedMimeType;
    sizeBytes : number;
    createdAt : string;
    /** Ruta relativa a la propia API (no una URL firmada externa) — requiere anteponer el base URL y autenticar, ver usePqrsAssetSrc. */
    viewUrl : string;
}

export interface CreatePqrsRequestDTO {
    type: PqrsType;
    subject: string;
    description: string;
    assetIds?: number[];
}

export interface PqrsResponseDTO {
    id: number;
    based: string;
    type: PqrsType;
    status: PqrsStatus;
    subject: string;
    description: string;
    response: string | null;
    dueDate: string;
    createdAt: string;
    resolvedAt: string | null;
    purchaseItemId: number | null;
    reasonCode : MarketPlaceIssueReason;
    action: PqrsResolutionAction | null;
    assets: PqrsAssetResponseDTO[] | null;
}

export interface PqrsAdminDetailDTO {
    id: number;
    based: string;
    type: PqrsType;
    status: PqrsStatus;
    subject: string;
    description: string;
    response: string | null;
    dueDate: string;
    createdAt: string;
    resolvedAt: string | null;
    requesterId: number;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    purchaseItemId: number | null;
    reasonCode: MarketPlaceIssueReason | null;
    action : PqrsResolutionAction;
    assets : PqrsAssetResponseDTO[] | null;
    product : PqrsProductContextDTO | null;
    commercial : PqrsCommercialContextDTO | null;
}   

export interface RespondPqrsRequestDTO {
    response: string;
    action : PqrsResolutionAction | null;
}

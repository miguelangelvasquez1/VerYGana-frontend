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

export interface CreatePqrsRequestDTO {
    type: PqrsType;
    subject: string;
    description: string;
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
}

export interface RespondPqrsRequestDTO {
    response: string;
    action : PqrsResolutionAction | null;
}

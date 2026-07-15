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
    RESUELTA = 'RESUELTA',
    CERRADA = 'CERRADA'
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
}

export interface RespondPqrsRequestDTO {
    response: string;
}
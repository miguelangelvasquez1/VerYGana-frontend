export interface EntityCreatedResponseDTO {
    id: number;
    message: string;
    timestamp: string;
}

export interface EntityUpdatedResponseDTO {
    id: number;
    message: string;
    timestamp: string;
}

export interface PagedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    sorted: boolean;
  };
}

export interface FileUploadPermission {
  uploadUrl: string;
  expiresInSeconds: number;
}
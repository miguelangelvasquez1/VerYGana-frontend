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

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FileUploadPermission {
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}
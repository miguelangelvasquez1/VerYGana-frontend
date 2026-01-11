
export interface ProductStockRequestDTO {
  code: string;
  additionalInfo: string;
  expirationDate: string | null; // formato ISO
}

export interface ProductStockResponseDTO {
  id : number;
  code : string;
  status : 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'INVALID';
  createdAt: string;
  soldAt : string;
}

export interface BulkStockResponseDTO {
  totalProcessed : number;
  successfullyAdded : number;
  failed : number;
  errors : string[];
  processedAt : string;
}

export interface ProductStockParams {
  page?: number;
  size?: number;
  search?: string;
  status?: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'INVALID';
}



export interface ProductStockRequestDTO {
  code: string;
  additionalInfo: string;
  expirationDate: string | null; // formato ISO
}
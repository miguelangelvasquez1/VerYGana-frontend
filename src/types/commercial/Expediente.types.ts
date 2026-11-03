export type CommercialDocumentType =
  | 'RUT' | 'CAMARA_COMERCIO' | 'CEDULA_REPRESENTANTE' | 'CERTIFICACION_BANCARIA'
  | 'PERMISO_SECTORIAL' | 'MARCA_REGISTRADA' | 'OTRO';
export type CommercialDocumentStatus = 'PENDING' | 'VALIDATED' | 'ORPHANED' | 'SUPERSEDED';
export type CommercialDocumentReviewStatus = 'NOT_REVIEWED' | 'ACCEPTED' | 'OBSERVED' | 'REJECTED';

export interface ExpedienteDocumentUploadRequest {
  documentType: CommercialDocumentType;
  originalFileName: string;
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number;                 // tamaño exacto del archivo
  replacesDocumentId?: number | null; // id del documento VIGENTE del mismo tipo que se reemplaza
}
export interface FileUploadPermission { uploadUrl: string; expiresInSeconds: number }
export interface DocumentUploadPermission { documentId: number; permission: FileUploadPermission }

export interface ExpedienteDocument {
  id: number;
  documentType: CommercialDocumentType;
  originalFileName: string;
  sizeBytes: number;
  status: CommercialDocumentStatus;   // VALIDATED = vigente, SUPERSEDED = historial
  uploadedAt: string;
  replacesDocumentId: number | null;
  supersededAt: string | null;
  reviewStatus: CommercialDocumentReviewStatus | null; // null en documentos antiguos = sin revisar
  reviewedAt: string | null;
  reviewNotes: string | null;
  holderIdentification: string | null;
  issuedAt: string | null;
  expiresAt: string | null;           // null = sin vencimiento
  expired: boolean;
  downloadUrl: string | null;         // válida 5 minutos
}

// Compliance
export interface DocumentReviewRequest {
  result: 'ACCEPTED' | 'OBSERVED' | 'REJECTED';
  holderIdentification?: string;  // obligatorio para ACCEPTED en RUT, CAMARA_COMERCIO, CERTIFICACION_BANCARIA, CEDULA_REPRESENTANTE
  issuedAt?: string;              // YYYY-MM-DD
  expiresAt?: string;             // YYYY-MM-DD, >= issuedAt; vacío si no tiene vigencia comprobable
  notes?: string;                 // obligatorio si OBSERVED o REJECTED, máx 1000
}

import apiClient from '@/lib/api/client';
import { LegalDocument, LegalDocumentType } from '@/services/LegalDocumentsService';

const BASE = '/admin/legal-documents';

export const MAX_LEGAL_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const LEGAL_DOCUMENT_MIME_TYPE = 'application/pdf';
export const MAX_RETAINED_VERSIONS = 10;

// version y publishedDate ya no se declaran: el backend calcula la versión
// como la última existente para ese tipo (+1, sin importar su estado) —
// arranca en "1" si no hay ninguna previa — y asigna publishedDate con la
// fecha del momento de la subida.
export interface PrepareLegalDocumentUploadRequest {
  type: LegalDocumentType;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PrepareLegalDocumentUploadResponse {
  documentId: number;
  permission: {
    uploadUrl: string;
    expiresInSeconds: number;
  };
}

// Historial de versiones ya publicadas (status VALIDATED) de un tipo, más
// reciente primero. El item con active=true es el vigente.
export const getLegalDocumentHistory = async (type: LegalDocumentType): Promise<LegalDocument[]> => {
  const res = await apiClient.get<LegalDocument[]>(`${BASE}/${type}/history`);
  return res.data;
};

// PASO 1 — pide una URL pre-firmada de R2 para subir el PDF directo desde el
// navegador. La URL expira en `expiresInSeconds` (~15 min); si se agota el
// tiempo hay que repetir este paso.
export const prepareLegalDocumentUpload = async (
  data: PrepareLegalDocumentUploadRequest
): Promise<PrepareLegalDocumentUploadResponse> => {
  const res = await apiClient.post<PrepareLegalDocumentUploadResponse>(`${BASE}/prepare-upload`, data);
  return res.data;
};

// PASO 2 — sube el archivo directo a R2 (PUT binario, sin pasar por el
// backend).
export const uploadLegalDocumentFile = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Error al subir el archivo (${res.status})`);
};

// PASO 3 — confirma la subida: publica la versión y desactiva la anterior del
// mismo tipo. El backend valida contra R2 que el archivo sea un PDF real y
// que el tamaño coincida con lo declarado en el paso 1 (400 si no coincide).
export const confirmLegalDocumentUpload = async (documentId: number): Promise<LegalDocument> => {
  const res = await apiClient.post<LegalDocument>(`${BASE}/${documentId}/confirm`);
  return res.data;
};

// Cancela una subida a medio camino (cambio de archivo, cierre del
// formulario, o falla el confirm) — borra el registro pendiente y el
// archivo en R2.
export const discardLegalDocumentUpload = async (documentId: number): Promise<void> => {
  await apiClient.post(`${BASE}/discard`, { documentId });
};

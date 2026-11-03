import apiClient from "@/lib/api/client";
import { OnboardingService } from "@/services/commercial/OnboardingService";
import type {
  DocumentUploadPermission,
  ExpedienteDocument,
  ExpedienteDocumentUploadRequest,
} from "@/types/commercial/Expediente.types";

const BASE = "/commercials/documents";

// Expediente documental del empresario (CA-7: sin eliminar ni editar).
export const ExpedienteService = {
  async list(): Promise<ExpedienteDocument[]> {
    const response = await apiClient.get<ExpedienteDocument[]>(BASE);
    return response.data;
  },

  async prepareUpload(body: ExpedienteDocumentUploadRequest): Promise<DocumentUploadPermission> {
    const response = await apiClient.post<DocumentUploadPermission>(`${BASE}/prepare-upload`, body);
    return response.data;
  },

  async confirmUpload(documentId: number): Promise<ExpedienteDocument> {
    const response = await apiClient.post<ExpedienteDocument>(`${BASE}/${documentId}/confirm`);
    return response.data;
  },

  // El PUT a R2 ya existe en el onboarding: no se duplica el fetch.
  uploadFile(uploadUrl: string, file: File): Promise<void> {
    return OnboardingService.uploadDocumentFile(uploadUrl, file);
  },
};

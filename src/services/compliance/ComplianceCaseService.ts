import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";
import type { Manifestation } from "@/types/commercial/Declaration.types";
import type { DocumentReviewRequest, ExpedienteDocument } from "@/types/commercial/Expediente.types";
import type {
  Finding,
  FindingRequest,
  Incident,
  IncidentRequest,
  InformationRequest,
} from "@/types/compliance/InformationRequest.types";

const COMMERCIALS = "/compliance/commercials";
const REQUESTS_PAGE_SIZE = 20;

// Caso del empresario visto por el oficial de cumplimiento: lecturas y la revisión de documentos.
// Crear requerimientos, hallazgos e incidencias es de la spec 018.
export const ComplianceCaseService = {
  async listDocuments(commercialPublicId: string): Promise<ExpedienteDocument[]> {
    const response = await apiClient.get<ExpedienteDocument[]>(`${COMMERCIALS}/${commercialPublicId}/documents`);
    return response.data;
  },

  async reviewDocument(documentId: number, body: DocumentReviewRequest): Promise<ExpedienteDocument> {
    const response = await apiClient.post<ExpedienteDocument>(
      `/compliance/commercial-documents/${documentId}/review`,
      body,
    );
    return response.data;
  },

  async listCommitment(commercialPublicId: string): Promise<Manifestation[]> {
    const response = await apiClient.get<Manifestation[]>(
      `${COMMERCIALS}/${commercialPublicId}/declarations/FORMALIZATION_COMMITMENT`,
    );
    return response.data;
  },

  // Página base 0; nunca manda `status`.
  async listRequests(commercialPublicId: string, page: number): Promise<PagedResponse<InformationRequest>> {
    const response = await apiClient.get<PagedResponse<InformationRequest>>("/compliance/information-requests", {
      params: { commercialPublicId, page, size: REQUESTS_PAGE_SIZE },
    });
    return response.data;
  },

  async listFindings(commercialPublicId: string): Promise<Finding[]> {
    const response = await apiClient.get<Finding[]>(`${COMMERCIALS}/${commercialPublicId}/findings`);
    return response.data;
  },

  async listIncidents(commercialPublicId: string): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>(`${COMMERCIALS}/${commercialPublicId}/incidents`);
    return response.data;
  },

  async createFinding(body: FindingRequest): Promise<Finding> {
    const response = await apiClient.post<Finding>("/compliance/findings", body);
    return response.data;
  },

  async createIncident(body: IncidentRequest): Promise<Incident> {
    const response = await apiClient.post<Incident>("/compliance/incidents", body);
    return response.data;
  },
};

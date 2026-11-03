import apiClient from "@/lib/api/client";
import type {
  InformationRequest,
  RespondRequest,
} from "@/types/compliance/InformationRequest.types";

const BASE = "/commercials/information-requests";

// Solicitudes de información vistas por el empresario.
export const InformationRequestService = {
  async listMine(): Promise<InformationRequest[]> {
    const response = await apiClient.get<InformationRequest[]>(BASE);
    return response.data;
  },

  async getMine(publicId: string): Promise<InformationRequest> {
    const response = await apiClient.get<InformationRequest>(`${BASE}/${publicId}`);
    return response.data;
  },

  async respond(publicId: string, body: RespondRequest): Promise<InformationRequest> {
    const response = await apiClient.post<InformationRequest>(`${BASE}/${publicId}/responses`, body);
    return response.data;
  },
};

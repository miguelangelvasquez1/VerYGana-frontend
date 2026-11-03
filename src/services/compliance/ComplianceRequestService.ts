import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";
import type {
  CancelInformationRequest,
  CreateInformationRequest,
  InformationRequest,
  InformationRequestStatus,
  ReviewInformationRequest,
} from "@/types/compliance/InformationRequest.types";

const BASE = "/compliance/information-requests";

export interface RequestSearchParams {
  status?: InformationRequestStatus; // sin status, la API devuelve todos
  commercialPublicId?: string;
  page: number;                      // base 0
  size: number;
}

// Requerimientos de información vistos por el oficial de cumplimiento.
export const ComplianceRequestService = {
  async search(params: RequestSearchParams): Promise<PagedResponse<InformationRequest>> {
    const response = await apiClient.get<PagedResponse<InformationRequest>>(BASE, { params });
    return response.data;
  },

  async get(requestPublicId: string): Promise<InformationRequest> {
    const response = await apiClient.get<InformationRequest>(`${BASE}/${requestPublicId}`);
    return response.data;
  },

  async create(body: CreateInformationRequest): Promise<InformationRequest> {
    const response = await apiClient.post<InformationRequest>(BASE, body);
    return response.data;
  },

  async review(requestPublicId: string, body: ReviewInformationRequest): Promise<InformationRequest> {
    const response = await apiClient.post<InformationRequest>(`${BASE}/${requestPublicId}/review`, body);
    return response.data;
  },

  async cancel(requestPublicId: string, body: CancelInformationRequest): Promise<InformationRequest> {
    const response = await apiClient.post<InformationRequest>(`${BASE}/${requestPublicId}/cancel`, body);
    return response.data;
  },
};

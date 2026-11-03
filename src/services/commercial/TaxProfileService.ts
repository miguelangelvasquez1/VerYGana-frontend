import apiClient from "@/lib/api/client";
import type {
  CatalogEntry,
  CloseEstablishmentRequest,
  Establishment,
  EstablishmentRequest,
  TaxProfileResponse,
  TaxProfileSubmitRequest,
  TaxProfileVersionDetail,
  VersionSummary,
} from "@/types/commercial/TaxProfile.types";

const BASE = "/commercials";

export const TaxProfileService = {
  // 204 (todavía no envió la ficha) no es un error: es "no existe".
  async getTaxProfile(): Promise<TaxProfileResponse | null> {
    const response = await apiClient.get<TaxProfileResponse>(`${BASE}/tax-profile`);
    return response.status === 204 ? null : response.data;
  },

  async submitTaxProfile(body: TaxProfileSubmitRequest): Promise<TaxProfileResponse> {
    const response = await apiClient.put<TaxProfileResponse>(`${BASE}/tax-profile`, body);
    return response.data;
  },

  async listTaxProfileVersions(): Promise<VersionSummary[]> {
    const response = await apiClient.get<VersionSummary[]>(`${BASE}/tax-profile/versions`);
    return response.data;
  },

  async getTaxProfileVersion(versionNumber: number): Promise<TaxProfileVersionDetail> {
    const response = await apiClient.get<TaxProfileVersionDetail>(
      `${BASE}/tax-profile/versions/${versionNumber}`,
    );
    return response.data;
  },

  async getTaxCatalog(): Promise<CatalogEntry[]> {
    const response = await apiClient.get<CatalogEntry[]>(`${BASE}/tax-profile/catalog`);
    return response.data;
  },

  async listEstablishments(): Promise<Establishment[]> {
    const response = await apiClient.get<Establishment[]>(`${BASE}/establishments`);
    return response.data;
  },

  async createEstablishment(body: EstablishmentRequest): Promise<Establishment> {
    const response = await apiClient.post<Establishment>(`${BASE}/establishments`, body);
    return response.data;
  },

  async closeEstablishment(id: number, body: CloseEstablishmentRequest): Promise<Establishment> {
    const response = await apiClient.post<Establishment>(`${BASE}/establishments/${id}/close`, body);
    return response.data;
  },
};

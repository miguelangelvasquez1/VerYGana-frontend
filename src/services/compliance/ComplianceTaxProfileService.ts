import apiClient from "@/lib/api/client";
import type { PagedResponse } from "@/types/Generic.types";
import type {
  CatalogEntry,
  CatalogEntryRequest,
  ComplianceTaxProfileResponse,
  RetireCatalogEntryRequest,
  SectionReviewRequest,
  TaxProfileSection,
  TaxProfileStatus,
  TaxProfileSummary,
  TaxProfileVersionDetail,
} from "@/types/commercial/TaxProfile.types";

const BASE = "/compliance/tax-profiles";

export interface TaxProfileListParams {
  status?: TaxProfileStatus; // sin status, la API devuelve todas
  page: number;              // base 0
  size: number;
}

// Fichas tributarias vistas por el oficial de cumplimiento.
export const ComplianceTaxProfileService = {
  async list(params: TaxProfileListParams): Promise<PagedResponse<TaxProfileSummary>> {
    const response = await apiClient.get<PagedResponse<TaxProfileSummary>>(BASE, { params });
    return response.data;
  },

  async get(commercialPublicId: string): Promise<ComplianceTaxProfileResponse> {
    const response = await apiClient.get<ComplianceTaxProfileResponse>(`${BASE}/${commercialPublicId}`);
    return response.data;
  },

  async getVersion(commercialPublicId: string, versionNumber: number): Promise<TaxProfileVersionDetail> {
    const response = await apiClient.get<TaxProfileVersionDetail>(
      `${BASE}/${commercialPublicId}/versions/${versionNumber}`,
    );
    return response.data;
  },

  // Activos y retirados: una versión anterior puede usar un código ya retirado.
  async getCatalog(): Promise<CatalogEntry[]> {
    const response = await apiClient.get<CatalogEntry[]>("/compliance/tax-catalog");
    return response.data;
  },

  async createCatalogEntry(body: CatalogEntryRequest): Promise<CatalogEntry> {
    const response = await apiClient.post<CatalogEntry>("/compliance/tax-catalog", body);
    return response.data;
  },

  async retireCatalogEntry(id: number, body: RetireCatalogEntryRequest): Promise<CatalogEntry> {
    const response = await apiClient.post<CatalogEntry>(`/compliance/tax-catalog/${id}/retire`, body);
    return response.data;
  },

  async reviewSection(
    commercialPublicId: string,
    section: TaxProfileSection,
    body: SectionReviewRequest,
  ): Promise<ComplianceTaxProfileResponse> {
    const response = await apiClient.post<ComplianceTaxProfileResponse>(
      `${BASE}/${commercialPublicId}/sections/${section}/review`,
      body,
    );
    return response.data;
  },
};

import apiClient from "@/lib/api/client";
import { EntityUpdatedResponseDTO } from "@/types/Generic.types";
import type { LegalRepDocType } from "@/services/commercial/OnboardingService";

export interface CommercialProfileSettingsResponseDTO {
  companyName: string;
  nit: string;
  mercantileRegistration: string | null;
  email: string;
  phoneNumber: string;
  address: string | null;
  legalRepFirstName: string | null;
  legalRepLastName: string | null;
  // null si la cuenta aún no completó la identificación jurídica
  legalRepDocType: LegalRepDocType | null;
  legalRepDocNumber: string | null;
  legalRepPepDeclaration: boolean;
  whatsappAvailable: boolean;
  whatsappNumber: string | null;
}

// PUT es un reemplazo completo: siempre se envían todos los campos del
// representante legal, hayan cambiado o no.
export interface CommercialProfileEditRequestDTO {
  email: string;
  phoneNumber: string;
  address: string;
  legalRepFirstName: string;
  legalRepLastName: string;
  legalRepDocType: LegalRepDocType;
  legalRepDocNumber: string;
  legalRepPepDeclaration: boolean;
  whatsappAvailable: boolean;
  whatsappNumber: string | null;
}

const BASE = "/commercials/profile";

export const ProfileService = {
  async getProfile(): Promise<CommercialProfileSettingsResponseDTO> {
    const response = await apiClient.get(BASE);
    return response.data;
  },

  async updateProfile(data: CommercialProfileEditRequestDTO): Promise<EntityUpdatedResponseDTO> {
    const response = await apiClient.put(`${BASE}/edit`, data);
    return response.data;
  },
};

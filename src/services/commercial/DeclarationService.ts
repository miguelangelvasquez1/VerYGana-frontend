import apiClient from "@/lib/api/client";
import type {
  DeclarationCode,
  DeclarationView,
  DisclosureContext,
} from "@/types/commercial/Declaration.types";

export const DeclarationService = {
  // Ojo: la API registra que el texto se puso a disposición del empresario cada vez que se pide.
  async getDeclaration(code: DeclarationCode, context: DisclosureContext): Promise<DeclarationView> {
    const response = await apiClient.get<DeclarationView>(`/commercials/declarations/${code}`, {
      params: { context },
    });
    return response.data;
  },
};

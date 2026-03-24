import apiClient from "@/lib/api/client";
import { CommercialInitialDataResponseDTO } from "@/types/ads/commercial";

/**
 * Obtener datos iniciales del consumidor
 */
export const getCommercialInitialData = async (): Promise<CommercialInitialDataResponseDTO> => {
  const response = await apiClient.get(`/commercials/initialData`);
  return response.data;
}
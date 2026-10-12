import apiClient from "@/lib/api/client";
import { ActiveKeyPromotionDTO } from "@/types/keys/KeyPromotion.types";

// Productos que hoy tienen cobertura especial con llaves. Es informativo: el
// tope que de verdad rige al usuario lo da POST /purchases/quote.
export const getActiveKeyPromotions = async (): Promise<ActiveKeyPromotionDTO[]> => {
    const response = await apiClient.get<ActiveKeyPromotionDTO[]>("/key-promotions/active");
    return response.data;
}

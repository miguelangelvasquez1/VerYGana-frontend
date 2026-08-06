import apiClient from "@/lib/api/client"
import { AllyCommercialResponseDTO, AllyPromotionResponseDTO } from "@/types/Allies.types";


export const togglePromotion = async (productId : number) : Promise<void> => {
    await apiClient.patch(`/commercial/allies/promotions/${productId}`);
}

export const getMyPromotions = async () : Promise<AllyPromotionResponseDTO[]> => {
    const response = await apiClient.get(`/commercial/allies/promotions`);
    return response.data;
}

export const getMyAllies = async () : Promise<AllyCommercialResponseDTO[]> => {
    const response = await apiClient.get(`/commercial/allies`);
    return response.data;
}

export const getMyPromoters = async () : Promise<AllyCommercialResponseDTO[]> => {
    const response = await apiClient.get(`/commercial/allies/promoters`);
    return response.data;
}
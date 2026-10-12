import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { KeyPromotionRequestDTO, KeyPromotionResponseDTO } from "@/types/keys/KeyPromotion.types";

const BASE_URL = "/admin/key-promotions";

export type KeyPromotionTransition = 'authorize' | 'pause' | 'resume' | 'end';

export const getPromotions = async (page: number, size: number): Promise<PagedResponse<KeyPromotionResponseDTO>> => {
    const response = await apiClient.get(BASE_URL, { params: { page, size } });
    return response.data;
}

export const getPromotion = async (id: number): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
}

export const createPromotion = async (request: KeyPromotionRequestDTO): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.post(BASE_URL, request);
    return response.data;
}

export const updatePromotion = async (id: number, request: KeyPromotionRequestDTO): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, request);
    return response.data;
}

export const inviteProduct = async (id: number, productId: number): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.post(`${BASE_URL}/${id}/offers`, { productId });
    return response.data;
}

export const removeOffer = async (id: number, offerId: number): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.delete(`${BASE_URL}/${id}/offers/${offerId}`);
    return response.data;
}

// authorize | pause | resume | end
export const transitionPromotion = async (id: number, transition: KeyPromotionTransition): Promise<KeyPromotionResponseDTO> => {
    const response = await apiClient.post(`${BASE_URL}/${id}/${transition}`);
    return response.data;
}

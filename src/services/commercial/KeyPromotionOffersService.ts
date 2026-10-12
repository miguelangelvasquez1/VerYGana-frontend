import apiClient from "@/lib/api/client";
import { KeyPromotionOfferDTO } from "@/types/keys/KeyPromotion.types";

const BASE_URL = "/commercial/key-promotions/offers";

export const getOffers = async (): Promise<KeyPromotionOfferDTO[]> => {
    const response = await apiClient.get<KeyPromotionOfferDTO[]>(BASE_URL);
    return response.data;
}

export const acceptOffer = async (offerId: number): Promise<KeyPromotionOfferDTO> => {
    const response = await apiClient.post<KeyPromotionOfferDTO>(`${BASE_URL}/${offerId}/accept`);
    return response.data;
}

export const rejectOffer = async (offerId: number): Promise<KeyPromotionOfferDTO> => {
    const response = await apiClient.post<KeyPromotionOfferDTO>(`${BASE_URL}/${offerId}/reject`);
    return response.data;
}

export const withdrawOffer = async (offerId: number): Promise<KeyPromotionOfferDTO> => {
    const response = await apiClient.post<KeyPromotionOfferDTO>(`${BASE_URL}/${offerId}/withdraw`);
    return response.data;
}

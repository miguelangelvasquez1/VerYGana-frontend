import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { FeaturedProductResponseDTO } from "@/types/purchases/purchaseItem.types";

export const getTotalCommercialSales = async (): Promise<number> => {
    const response = await apiClient.get<number>("/purchaseItems/totalSales");
    return response.data;
};

export const getTopSellingProductsPage = async(size? : number, page? : number) : Promise<PagedResponse<FeaturedProductResponseDTO>> => {
    const response = await apiClient.get("/purchaseItems/topSelling", {
        params: {
            size,
            page
        }
    });
    return response.data;
}

export const getDeliveredCode = async(purchaseItemId : number) : Promise<string> => {
    const response = await apiClient.get(`/purchaseItems/${purchaseItemId}/delivered-code`);
    return response.data;
}
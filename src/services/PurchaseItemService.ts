import apiClient from "@/lib/api/client";

export const getTotalSellerSales = async (): Promise<number> => {
    const response = await apiClient.get<number>("/purchaseItems/totalSales");
    return response.data;
};
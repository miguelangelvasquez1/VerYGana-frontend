import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { ConsumerRecognition } from "@/types/recognitions/Recognition.types";

// Regalos que VERYGANA le otorgó al consumidor. No aparecen en GET /purchases.
export const getMyRecognitions = async (page: number, size: number): Promise<PagedResponse<ConsumerRecognition>> => {
    const response = await apiClient.get("/recognitions/me", { params: { page, size } });
    return response.data;
}

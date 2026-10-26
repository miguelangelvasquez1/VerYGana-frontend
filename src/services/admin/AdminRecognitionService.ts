import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import {
    CandidatesParams,
    CreateRecognitionRequest,
    RecognitionCandidate,
    RecognitionDetail,
    RecognitionFund,
    RecognitionListParams,
    RecognitionSummary,
} from "@/types/recognitions/Recognition.types";

const BASE_URL = "/admin/recognitions";

export const getRecognitionFund = async (): Promise<RecognitionFund> => {
    const response = await apiClient.get(`${BASE_URL}/fund`);
    return response.data;
}

export const getRecognitionCandidates = async (params: CandidatesParams): Promise<PagedResponse<RecognitionCandidate>> => {
    const response = await apiClient.get(`${BASE_URL}/candidates`, { params });
    return response.data;
}

// `idempotencyKey` se genera una vez por reconocimiento y se reutiliza en cada
// reintento del mismo envío: el backend devuelve el mismo reconocimiento en
// vez de comprar dos veces.
export const createRecognition = async (
    request: CreateRecognitionRequest,
    idempotencyKey: string,
): Promise<RecognitionDetail> => {
    const response = await apiClient.post(BASE_URL, request, {
        headers: { "Idempotency-Key": idempotencyKey },
    });
    return response.data;
}

export const getRecognitions = async (params: RecognitionListParams): Promise<PagedResponse<RecognitionSummary>> => {
    const response = await apiClient.get(BASE_URL, {
        params: { sort: "createdAt,desc", ...params },
    });
    return response.data;
}

export const getRecognition = async (publicId: string): Promise<RecognitionDetail> => {
    const response = await apiClient.get(`${BASE_URL}/${publicId}`);
    return response.data;
}

export const cancelRecognition = async (publicId: string, cause: string): Promise<RecognitionDetail> => {
    const response = await apiClient.post(`${BASE_URL}/${publicId}/cancel`, { cause });
    return response.data;
}

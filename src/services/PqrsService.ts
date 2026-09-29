import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { CreatePqrsRequestDTO, PqrsAssetResponseDTO, PqrsAssetUploadPermissionDTO, PqrsResponseDTO, PreparePqrsAssetRequestDTO } from "@/types/Pqrs.types";

const BASE_URL = "/pqrs";

export const prepareAssetUpload = async (request : PreparePqrsAssetRequestDTO) : Promise<PqrsAssetUploadPermissionDTO> => {
    const response = await apiClient.post(BASE_URL + "/assets/prepare-upload", request);
    return response.data;
}

export const confirmAssetUpload = async (id : number) : Promise<PqrsAssetResponseDTO> => {
    const response = await apiClient.post(BASE_URL + `/assets/${id}/confirm`);
    return response.data;
}

export const createPqrs = async (request : CreatePqrsRequestDTO) : Promise<PqrsResponseDTO> => {
    const response = await apiClient.post('/pqrs', request);
    return response.data;
}

export const getMyPqrs = async () : Promise<PagedResponse<PqrsResponseDTO>> => {
    const response = await apiClient.get('/pqrs/mine');
    return response.data;
}

export const getMyPqrsById = async (id: number) : Promise<PqrsResponseDTO> => {
    const response = await apiClient.get(`/pqrs/${id}`);
    return response.data;
}
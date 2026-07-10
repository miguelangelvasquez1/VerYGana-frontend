import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { CreatePqrsRequestDTO, PqrsResponseDTO } from "@/types/Pqrs.types";

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
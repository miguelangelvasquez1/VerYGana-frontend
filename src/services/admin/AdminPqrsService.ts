import apiClient from "@/lib/api/client";
import { PagedResponse } from "@/types/Generic.types";
import { PqrsAdminDetailDTO, PqrsResponseDTO, PqrsStatus, PqrsType, RespondPqrsRequestDTO } from "@/types/Pqrs.types";

export const getAssignedPqrs = async (status: PqrsStatus | undefined, type : PqrsType | undefined, page: number, size: number) : Promise<PagedResponse<PqrsAdminDetailDTO>> => {
    const response = await apiClient.get('/admin/pqrs', {params: {status, type, page, size}});
    return response.data;
}

export const getPqrsDetail = async (id: number) : Promise<PqrsAdminDetailDTO> => {
    const response = await apiClient.get(`/admin/pqrs/${id}`);
    return response.data;
}

export const markUnderReview = async (id: number) : Promise<void> => {
    const response = await apiClient.patch(`/admin/pqrs/${id}/review`);
    return response.data;
}

export const respondToPqrs = async (id: number, request : RespondPqrsRequestDTO) => {
    const response = await apiClient.patch(`/admin/pqrs/${id}/respond`, request);
    return response.data;
}
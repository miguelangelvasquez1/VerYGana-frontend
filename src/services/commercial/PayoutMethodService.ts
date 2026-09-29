import apiClient from "@/lib/api/client";
import { AssetUploadPermissionDTO, EntityCreatedResponseDTO, FileUploadRequestDTO, PagedResponse } from "@/types/Generic.types";
import { CreatePayoutMethodRequestDTO, PayoutBankResponseDTO, VerifyOtpRequestDTO, PayoutMethodResponseDTO, ConfirmPayoutMethodCertificateUploadRequestDTO } from "@/types/PayoutMethod.types";

const BASE_URL = "/commercial/payout-methods";

export const prepareCertificateUpload = async (id : number, metadata : FileUploadRequestDTO) : Promise<AssetUploadPermissionDTO> => {
    const response = await apiClient.post(BASE_URL + `/${id}/certificate/prepare`, metadata);
    return response.data;
}

export const confirmCertificateUpload = async (id : number, request : ConfirmPayoutMethodCertificateUploadRequestDTO) : Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post(BASE_URL + `/${id}/certificate/confirm`, request);
    return response.data;
}

export const create = async (request : CreatePayoutMethodRequestDTO) : Promise<EntityCreatedResponseDTO> => {
    const response = await apiClient.post(BASE_URL, request);
    return response.data;
}

export const getBanks = async () : Promise<PayoutBankResponseDTO[]> => {
    const response = await apiClient.get(BASE_URL + "/banks");
    return response.data;
}

export const verifyOtp = async (id : number, request: VerifyOtpRequestDTO) : Promise<void> => {
    await apiClient.post(BASE_URL + `/${id}/verify-otp`, request);
}

export const resendOtp = async (id : number) :Promise<void> => {
    await apiClient.post(BASE_URL + `/${id}/resend-otp`);
}

export const getAll = async (page : number, size : number) : Promise<PagedResponse<PayoutMethodResponseDTO>> => {
    const response = await apiClient.get(BASE_URL, {
        params : {
            page,
            size
        }
    });
    return response.data;
}

export const deactivate = async (id : number) : Promise<void> => {
    await apiClient.put(BASE_URL + `/${id}/deactivate`);
}

export const setDefault = async (id : number) : Promise<void> => {
    await apiClient.put(BASE_URL + `/${id}/set-default`);
}
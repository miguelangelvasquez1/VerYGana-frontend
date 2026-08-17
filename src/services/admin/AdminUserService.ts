import apiClient from "@/lib/api/client";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import { EntityUpdatedResponseDTO, PagedResponse } from "@/types/Generic.types";
import { Role, UserSummaryResponseDTO, UserLevel, Gender, ConsumerSummaryResponseDTO, ConsumerResponseDTO, UserState, AdminSummaryResponseDTO, AdminResponseDTO, CommercialSummaryResponseDTO, CommercialResponseDTO, GameDesignerSummaryResponseDTO, GameDesignerResponseDTO, ComplianceOfficerSummaryResponseDTO, ComplianceOfficerResponseDTO, EditBasicInfoRequestDTO, SendNotificationRequestDTO } from "@/types/User.types";

export const BASE_ADMIN_USERS_URL = "/admin/users";

export const countActiveUsersByRole = async (role: Role) : Promise<number> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/stats", {
        params: {
            role
        }
    });
    return response.data;
}

export const getNewUsers= async (startDate : string, endDate : string, search? : string, page? : number, size? : number) : Promise<PagedResponse<UserSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/news", {
        params: {
            startDate,
            endDate,
            search,
            page,
            size
        }
    });
    return response.data;
}

export const getConsumers = async (level? : UserLevel, search? : string, userState? : UserState, maxAge? : number, minAge? : number, gender? : Gender, departmentCode? : string,
     municipalityCode? : string, startDate? : string, endDate? : string, page? : number, size? : number) : Promise<PagedResponse<ConsumerSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/consumers", {
        params: {
            level,
            search,
            userState,
            maxAge,
            minAge,
            gender,
            departmentCode,
            municipalityCode,
            startDate,
            endDate,
            page,
            size
        }
    });
    return response.data;
}

export const getConsumer = async (publicId : string) : Promise<ConsumerResponseDTO> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + `/consumers/${publicId}`);
    return response.data;
}

export const getAdmins = async (search? : string, userState? : UserState, page? : number, size? : number) : Promise<PagedResponse<AdminSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/admins", {
        params: {
            search,
            userState,
            page,
            size
        }
    });
    return response.data;
}

export const getAdmin = async (publicId : string) : Promise<AdminResponseDTO> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + `/admins/${publicId}`);
    return response.data;
} 

export const getCommercials = async (search? : string, userState? : UserState, currentPlan? : PlanCode, page? : number, size? : number) : Promise<PagedResponse<CommercialSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/commercials", {
        params: {
            search,
            userState,
            currentPlan,
            page,
            size
        }
    });
    return response.data;
}

export const getCommercial = async (publicId : string) : Promise<CommercialResponseDTO> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + `/commercials/${publicId}`);
    return response.data;
} 

export const getGameDesigners = async (search? : string, userState? : UserState, page? : number, size? : number) : Promise<PagedResponse<GameDesignerSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/game-designers", {
        params: {
            search,
            userState,
            page,
            size
        }
    })
    return response.data;
}

export const getGameDesigner = async (publicId : string) : Promise<GameDesignerResponseDTO> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + `/game-designers/${publicId}`)
    return response.data;
}

export const getComplianceOfficers = async (search? : string, userState? : UserState, page? : number, size? : number) : Promise<PagedResponse<ComplianceOfficerSummaryResponseDTO>> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + "/compliance-officers", {
        params: {
            search,
            userState,
            page,
            size
        }
    })
    return response.data;
}

export const getComplianceOfficer = async (publicId : string) : Promise<ComplianceOfficerResponseDTO> => {
    const response = await apiClient.get(BASE_ADMIN_USERS_URL + `/compliance-officers/${publicId}`)
    return response.data;
}

export const blockUser = async (publicId : string, reason : string) : Promise<void> => {
    await apiClient.patch(BASE_ADMIN_USERS_URL + `/${publicId}/block`, null, {
        params: {
            reason
        }
    });
}

export const unblockUser = async (publicId : string, reason : string) : Promise<void> => {
    await apiClient.patch(BASE_ADMIN_USERS_URL + `/${publicId}/unblock`, null, {
        params: {
            reason
        }
    });
}

export const editBasicInfo = async (publicId : string, request : EditBasicInfoRequestDTO) : Promise<EntityUpdatedResponseDTO> => {
    const response = await apiClient.put(BASE_ADMIN_USERS_URL + `/${publicId}`, request);
    return response.data;
}

export const sendNotification = async (publicId : string, message : string) : Promise<void> => {
    const response = await apiClient.post(BASE_ADMIN_USERS_URL + `/${publicId}/send-notification`, null, {
        params: {
            message
        }
    });
    return response.data;
}

export const sendNotications = async (request : SendNotificationRequestDTO) : Promise<void> => {
    const response = await apiClient.post(BASE_ADMIN_USERS_URL + "/send-notifications", request);
    return response.data;
}




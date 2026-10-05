import apiClient from "@/lib/api/client";
import { NotificationResponseDTO, PagedResponse } from "@/types/Generic.types";

export const getNotifications = async (page: number, size: number): Promise<PagedResponse<NotificationResponseDTO>> => {
    const response = await apiClient.get("/notifications", { params: { page, size } });
    return response.data;
}

export const getUnreadCount = async (): Promise<number> => {
    const response = await apiClient.get("/notifications/unread/count");
    return response.data;
}

export const markAllAsRead = async (): Promise<void> => {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data;
}

// El stream SSE vive en lib/notifications/notificationStream.ts (una conexión por pestaña).
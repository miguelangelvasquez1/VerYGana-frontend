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

// SSE — devuelve la instancia para poder cerrarla desde el hook
export const createNotificationStream = (
    token: string,
    onNotification: (notification: NotificationResponseDTO) => void,
    onError?: (error: Event) => void
): EventSource => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    // El token va en query param porque SSE no soporta headers custom
    const url = `${baseUrl}/notifications/stream?token=${token}`;
    
    const eventSource = new EventSource(url);

    eventSource.addEventListener("notification", (event: MessageEvent) => {
        const notification: NotificationResponseDTO = JSON.parse(event.data);
        onNotification(notification);
    });

    eventSource.onerror = (error) => {
        onError?.(error);
        // El browser reconecta automáticamente, no es necesario cerrar
    };

    return eventSource;
};
// Claves de React Query de notificaciones. Las comparten useNotifications (que hace
// las consultas) y NotificationsProvider (que escribe en esas mismas cachés lo que
// llega por SSE): si no coinciden, lo que llega por el stream no se ve.

import { InfiniteData } from '@tanstack/react-query';
import { NotificationResponseDTO, PagedResponse } from '@/types/Generic.types';

/** Prefijo común: invalidarlo refresca lista y conteo a la vez. */
export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const NOTIFICATIONS_LIST_KEY = ['notifications', 'list'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

export type NotificationPages = InfiniteData<PagedResponse<NotificationResponseDTO>, number>;

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToNotificationStream } from '@/lib/notifications/notificationStream';
import {
  NOTIFICATIONS_KEY,
  NOTIFICATIONS_LIST_KEY,
  NOTIFICATIONS_UNREAD_COUNT_KEY,
  NotificationPages,
} from '@/lib/notifications/queryKeys';

// Mantiene el stream SSE de notificaciones abierto mientras haya sesión. Vive en el
// layout raíz para que la conexión sobreviva a la navegación: cuando la suscripción
// estaba en useNotifications, se cerraba y se reabría cada vez que cambiaba el
// componente con campanita montado.
//
// Solo escribe en cachés que ya existen. No pide lista ni conteo: eso lo hace
// useNotifications al montarse, así las páginas sin campanita no generan requests.
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isAuthenticated) return;

    return subscribeToNotificationStream({
      onNotification: (incoming) => {
        const pages = queryClient.getQueryData<NotificationPages>(NOTIFICATIONS_LIST_KEY);
        // Ya está en la lista (un refetch la trajo antes que el evento): el conteo
        // de ese mismo refetch ya la incluye.
        if (pages?.pages.some((page) => page.data.some((n) => n.id === incoming.id))) return;

        // Devolver undefined desde el updater deja la caché sin crear.
        queryClient.setQueryData<NotificationPages>(NOTIFICATIONS_LIST_KEY, (prev) => {
          if (!prev || prev.pages.length === 0) return prev;
          const [first, ...rest] = prev.pages;
          return { ...prev, pages: [{ ...first, data: [incoming, ...first.data] }, ...rest] };
        });
        queryClient.setQueryData<number>(NOTIFICATIONS_UNREAD_COUNT_KEY, (prev) =>
          prev === undefined ? prev : prev + 1,
        );
      },
      // Lo que se haya emitido mientras el stream estuvo caído no se reenvía.
      onReconnect: () => {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      },
    });
  }, [isAuthenticated, queryClient]);

  return <>{children}</>;
}

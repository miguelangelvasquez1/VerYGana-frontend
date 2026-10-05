// hooks/useNotifications.ts
'use client';

import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getNotifications,
    getUnreadCount,
    markAllAsRead as markAllAsReadService,
} from "@/services/NotificationService";
import {
    NOTIFICATIONS_KEY,
    NOTIFICATIONS_LIST_KEY,
    NOTIFICATIONS_UNREAD_COUNT_KEY,
    NotificationPages,
} from "@/lib/notifications/queryKeys";

const PAGE_SIZE = 20;

// Lista y conteo en React Query: varios componentes (o el doble montaje de
// StrictMode) comparten una sola request en vez de disparar una cada uno.
// Lo que llega por SSE lo escribe NotificationsProvider en estas mismas cachés.
export function useNotifications() {
    const queryClient = useQueryClient();

    const listQuery = useInfiniteQuery({
        queryKey: NOTIFICATIONS_LIST_KEY,
        queryFn: ({ pageParam }) => getNotifications(pageParam, PAGE_SIZE),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.meta.hasNext ? allPages.length : undefined,
    });

    const countQuery = useQuery({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY,
        queryFn: getUnreadCount,
    });

    const unreadCount = countQuery.data ?? 0;

    // Una notificación que llega por SSE desplaza los offsets del servidor, así que
    // la página siguiente puede repetir un ítem ya mostrado: se filtra por id.
    const notifications = useMemo(() => {
        const seen = new Set<number>();
        return (listQuery.data?.pages ?? [])
            .flatMap((page) => page.data)
            .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    }, [listQuery.data]);

    const setAllRead = useCallback((isRead: boolean) => {
        queryClient.setQueryData<NotificationPages>(NOTIFICATIONS_LIST_KEY, (prev) =>
            prev && {
                ...prev,
                pages: prev.pages.map((page) => ({
                    ...page,
                    data: page.data.map((n) => ({ ...n, isRead })),
                })),
            });
    }, [queryClient]);

    // ── Cargar más ─────────────────────────────────────────────
    const { hasNextPage, isFetchingNextPage, fetchNextPage } = listQuery;
    const loadMore = useCallback(async () => {
        if (!hasNextPage || isFetchingNextPage) return;
        await fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ── Marcar TODAS como leídas ───────────────────────────────
    // Se llama al abrir el panel, solo si hay no leídas
    const markAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return; // nada que hacer

        // Optimistic update inmediato — el usuario ve el cambio al instante
        setAllRead(true);
        queryClient.setQueryData<number>(NOTIFICATIONS_UNREAD_COUNT_KEY, 0);

        try {
            await markAllAsReadService();
        } catch (err) {
            // Rollback: se vuelve a pedir el estado real al servidor
            console.error("Error marcando todas como leídas:", err);
            await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        }
    }, [unreadCount, setAllRead, queryClient]);

    const reload = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    }, [queryClient]);

    return {
        notifications,
        unreadCount,
        loading: listQuery.isLoading || isFetchingNextPage,
        hasMore: hasNextPage,
        markAllAsRead,
        loadMore,
        reload,
    };
}

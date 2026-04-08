// hooks/useNotifications.ts
'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import {
    getNotifications,
    getUnreadCount,
    markAllAsRead as markAllAsReadService,
    createNotificationStream,
} from "@/services/NotificationService";
import { NotificationResponseDTO } from "@/types/Generic.types";
import { getSession } from "next-auth/react";

const PAGE_SIZE = 20;

export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const eventSourceRef = useRef<EventSource | null>(null);

    // ── Carga inicial ──────────────────────────────────────────
    const loadInitial = useCallback(async () => {
        setLoading(true);
        try {
            const [paged, count] = await Promise.all([
                getNotifications(0, PAGE_SIZE),
                getUnreadCount(),
            ]);
            setNotifications(paged.data);
            setHasMore(paged.meta.hasNext);
            setPage(0);
            setUnreadCount(count);
        } catch (err) {
            console.error("Error cargando notificaciones:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Cargar más ─────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const nextPage = page + 1;
            const paged = await getNotifications(nextPage, PAGE_SIZE);
            setNotifications((prev) => [...prev, ...paged.data]);
            setHasMore(paged.meta.hasNext);
            setPage(nextPage);
        } catch (err) {
            console.error("Error cargando más notificaciones:", err);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page]);

    // ── Marcar TODAS como leídas ───────────────────────────────
    // Se llama al abrir el panel, solo si hay no leídas
    const markAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return; // nada que hacer

        // Optimistic update inmediato — el usuario ve el cambio al instante
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await markAllAsReadService();
        } catch (err) {
            // Rollback si el backend falla
            console.error("Error marcando todas como leídas:", err);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: false })));
            // Recarga el conteo real desde el servidor
            const count = await getUnreadCount();
            setUnreadCount(count);
        }
    }, [unreadCount]);

    // ── SSE ────────────────────────────────────────────────────
    const connectSSE = useCallback(async () => {
        if (eventSourceRef.current) return;
        const session = await getSession();
        const token = (session as any)?.accessToken;
        if (!token) return;

        eventSourceRef.current = createNotificationStream(
            token,
            (newNotification) => {
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
            },
            (error) => console.warn("SSE error:", error)
        );
    }, []);

    const disconnectSSE = useCallback(() => {
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
    }, []);

    useEffect(() => {
        connectSSE();
        return () => disconnectSSE();
    }, [connectSSE, disconnectSSE]);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    return {
        notifications,
        unreadCount,
        loading,
        hasMore,
        markAllAsRead,
        loadMore,
        reload: loadInitial,
    };
}
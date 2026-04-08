// components/notifications/NotificationsPanel.tsx
'use client';

import React, { useRef, useCallback, useState } from "react";
import { Bell, CheckCheck, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { NotificationResponseDTO } from "@/types/Generic.types";

const MESSAGE_TRUNCATE_LENGTH = 100;

interface Props {
    notifications: NotificationResponseDTO[];
    unreadCount: number;
    loading: boolean;
    hasMore: boolean;
    isOpen: boolean;
    onToggle: () => void;        // abre/cierra el panel
    onMarkAllAsRead: () => void; // se llama al abrir
    onLoadMore: () => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
}

// ── Item individual ──────────────────────────────────────────
function NotificationItem({ notification }: { notification: NotificationResponseDTO }) {
    const [expanded, setExpanded] = useState(false);

    const isLong = notification.message.length > MESSAGE_TRUNCATE_LENGTH;
    const displayMessage =
        expanded || !isLong
            ? notification.message
            : notification.message.slice(0, MESSAGE_TRUNCATE_LENGTH) + "…";

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diffMin < 1) return "Ahora";
        if (diffMin < 60) return `Hace ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `Hace ${diffH}h`;
        return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    };

    return (
        <div className={`flex items-start gap-3 px-4 py-3 transition-colors
            ${notification.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50"}`}
        >
            {/* Dot */}
            <div className="mt-1.5 flex-shrink-0">
                {notification.isRead
                    ? <div className="w-2 h-2 rounded-full bg-gray-200" />
                    : <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                }
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug
                    ${notification.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                    {notification.title}
                </p>

                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">
                    {displayMessage}
                </p>

                {/* Ver más / Ver menos */}
                {isLong && (
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}   // ← ejecuta el toggle normalmente
                        className="flex items-center gap-0.5 mt-1 text-[11px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                        {expanded
                            ? <><ChevronUp className="w-3 h-3" />Ver menos</>
                            : <><ChevronDown className="w-3 h-3" />Ver más</>
                        }
                    </button>
                )}

                <p className="text-[11px] text-gray-400 mt-1">
                    {formatDate(notification.createdAt)}
                </p>
            </div>
        </div>
    );
}

// ── Panel principal ──────────────────────────────────────────
export function NotificationPanel({
    notifications, unreadCount, loading, hasMore,
    isOpen, onToggle, onMarkAllAsRead, onLoadMore, menuRef,
}: Props) {

    const listRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || loading || !hasMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) onLoadMore();
    }, [loading, hasMore, onLoadMore]);

    // Al abrir el panel → marcar todas como leídas automáticamente
    const handleToggle = () => {
        if (!isOpen) {
            // Solo al ABRIR, no al cerrar
            onMarkAllAsRead();
        }
        onToggle();
    };

    return (
        <div className="relative" ref={menuRef}>

            {/* Campanita */}
            <button
                onClick={handleToggle}
                className="relative flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition-all"
            >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute right-0 mt-2 w-96 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300
                    ${isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                    <div className="text-lg font-semibold">Notificaciones</div>
                    {unreadCount > 0 && (
                        <div className="text-xs text-blue-100 mt-0.5">{unreadCount} sin leer</div>
                    )}
                </div>

                {/* Lista */}
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="max-h-[420px] overflow-y-auto divide-y divide-gray-50"
                >
                    {notifications.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Bell className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No tienes notificaciones aún</p>
                        </div>
                    )}

                    {notifications.map((n) => (
                        <NotificationItem key={n.id} notification={n} />
                    ))}

                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                    )}

                    {!hasMore && notifications.length > 0 && (
                        <p className="text-center text-xs text-gray-400 py-3">
                            Ya viste todas las notificaciones
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
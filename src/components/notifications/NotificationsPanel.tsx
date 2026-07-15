// components/notifications/NotificationsPanel.tsx
'use client';

import React, { useRef, useCallback, useState } from "react";
import { Bell, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { NotificationResponseDTO } from "@/types/Generic.types";

const MESSAGE_TRUNCATE_LENGTH = 100;

interface Props {
    notifications: NotificationResponseDTO[];
    unreadCount: number;
    loading: boolean;
    hasMore: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onMarkAllAsRead: () => void;
    onLoadMore: () => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
    variant?: 'dark' | 'light';
}

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
        <div className={`flex items-start gap-3 px-4 py-3 transition-colors ${notification.isRead ? "bg-white hover:bg-gray-50" : "bg-[#00a4ff]/5"}`}>
            <div className="mt-1.5 shrink-0">
                {notification.isRead
                    ? <div className="w-2 h-2 rounded-full bg-gray-200" />
                    : <div className="w-2 h-2 rounded-full bg-[#00a4ff] animate-pulse" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${notification.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {displayMessage}
                </p>
                {isLong && (
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-0.5 mt-1 text-[11px] text-[#00a4ff] hover:text-[#03548C] font-medium transition-colors cursor-pointer"
                    >
                        {expanded
                            ? <><ChevronUp className="w-3 h-3" />Ver menos</>
                            : <><ChevronDown className="w-3 h-3" />Ver más</>
                        }
                    </button>
                )}
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
            </div>
        </div>
    );
}

export function NotificationPanel({
    notifications, unreadCount, loading, hasMore,
    isOpen, onToggle, onMarkAllAsRead, onLoadMore, menuRef,
    variant = 'dark',
}: Props) {

    const desktopListRef = useRef<HTMLDivElement>(null);
    const mobileListRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback((el: HTMLDivElement | null) => {
        if (!el || loading || !hasMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) onLoadMore();
    }, [loading, hasMore, onLoadMore]);

    const handleToggle = () => {
        if (!isOpen) onMarkAllAsRead();
        onToggle();
    };

    const PanelHeader = () => (
        <div className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] px-4 py-4 text-white shrink-0">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold">Notificaciones</div>
                    {unreadCount > 0 && (
                        <div className="text-xs text-[#00a4ff] mt-0.5">{unreadCount} sin leer</div>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    className="sm:hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const ListContent = () => (
        <>
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
                    <Loader2 className="w-5 h-5 text-[#03548C] animate-spin" />
                </div>
            )}
            {!hasMore && notifications.length > 0 && (
                <p className="text-center text-xs text-gray-400 py-3">
                    Ya viste todas las notificaciones
                </p>
            )}
        </>
    );

    return (
        <div className="relative" ref={menuRef}>

            {/* ── Campanita ── */}
            <button
                onClick={handleToggle}
                className={`cursor-pointer relative flex items-center gap-2 px-3 py-2 transition-all ${
                    variant === 'light'
                        ? 'rounded-lg hover:bg-gray-100'
                        : 'rounded-full bg-white/10 hover:bg-white/20'
                }`}
            >
                <Bell className={`w-5 h-5 ${variant === 'light' ? 'text-gray-500' : 'text-white'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ── DESKTOP: dropdown absoluto ── */}
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`hidden sm:block absolute right-0 mt-2 w-96 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-300 ${
                    isOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                }`}
            >
                <PanelHeader />
                <div
                    ref={desktopListRef}
                    onScroll={() => handleScroll(desktopListRef.current)}
                    className="max-h-104 overflow-y-auto divide-y divide-gray-50"
                >
                    <ListContent />
                </div>
            </div>

            {/* ── MOBILE: backdrop ── */}
            <div
                className={`sm:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={handleToggle}
            />

            {/* ── MOBILE: bottom sheet ── */}
            <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 bg-white">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                <PanelHeader />

                <div
                    ref={mobileListRef}
                    onScroll={() => handleScroll(mobileListRef.current)}
                    style={{ maxHeight: '65vh', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                    className="divide-y divide-gray-50 overscroll-contain"
                >
                    <ListContent />
                </div>
            </div>

        </div>
    );
}

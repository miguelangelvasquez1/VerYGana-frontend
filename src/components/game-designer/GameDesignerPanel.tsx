'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Palette,
  User,
  RefreshCw,
  Loader2,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  getDesignerRequests,
  type DesignerBrandingSummary,
} from '@/services/GameDesignerService';
import { useLogout } from '@/hooks/useLogout';
import type { BrandingStatus } from '@/services/BrandingRequestService';
import { DesignerRequestDetail } from './DesignerRequestDetail';
import { DesignerProfile } from './DesignerProfile';
import { NotificationPanel } from '@/components/notifications/NotificationsPanel';
import { useNotifications } from '@/hooks/useNotifications';

// ─── Status labels for the list ──────────────────────────────────────────────

const STATUS_LABEL: Partial<Record<BrandingStatus, { label: string; cls: string }>> = {
  APPROVED: { label: 'Listo para iniciar', cls: 'bg-teal-100 text-teal-800' },
  DESIGN_IN_PROGRESS: { label: 'En progreso', cls: 'bg-blue-100 text-blue-800' },
  CHANGES_REQUESTED: { label: 'Cambios solicitados', cls: 'bg-orange-100 text-orange-800' },
  PENDING_ADVERTISER_APPROVAL: { label: 'En revisión del anunciante', cls: 'bg-purple-100 text-purple-800' },
  LAUNCHED: { label: 'Campaña activa', cls: 'bg-emerald-100 text-emerald-800' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'requests' | 'detail' | 'profile';

// ─── Component ────────────────────────────────────────────────────────────────

export const GameDesignerPanel: React.FC = () => {
  const [view, setView] = useState<View>('requests');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore selected request from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      const numId = Number(id);
      if (!isNaN(numId) && numId > 0) {
        setSelectedId(numId);
        setView('detail');
      }
    }
  }, []);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const { logout } = useLogout();
  const { notifications, unreadCount, loading: notifLoading, hasMore, markAllAsRead, loadMore } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [requests, setRequests] = useState<DesignerBrandingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getDesignerRequests());
    } catch {
      setError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setView('detail');
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(id));
    window.history.pushState({}, '', url.toString());
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('requests');
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
    load();
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────

  const navItems: { label: string; icon: React.ElementType; value: View }[] = [
    { label: 'Mis solicitudes', icon: Palette, value: 'requests' },
    { label: 'Mi perfil', icon: User, value: 'profile' },
  ];

  const sidebar = (
    <div
      className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16 shrink-0">
        {sidebarOpen && (
          <span className="text-base font-bold text-gray-800 truncate">Panel Diseñador</span>
        )}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-4 space-y-1 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = view === item.value || (item.value === 'requests' && view === 'detail');
          return (
            <button
              key={item.value}
              onClick={() => { setView(item.value); if (item.value === 'requests') { setSelectedId(null); } }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                active
                  ? 'bg-violet-50 text-violet-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className={active ? 'text-violet-600' : 'text-gray-400'} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-gray-100 shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  // ── Content ───────────────────────────────────────────────────────────────

  let content: React.ReactNode;

  if (view === 'detail' && selectedId !== null) {
    content = <DesignerRequestDetail requestId={selectedId} onBack={handleBack} />;
  } else if (view === 'profile') {
    content = <DesignerProfile />;
  } else {
    // requests list
    content = (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Mis solicitudes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Campañas de branding asignadas a ti</p>
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Summary chips */}
        {requests.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total', value: requests.length, cls: 'bg-gray-100 text-gray-700' },
              { label: 'Cambios solicitados', value: requests.filter(r => r.status === 'CHANGES_REQUESTED').length, cls: 'bg-orange-100 text-orange-700' },
              { label: 'En progreso', value: requests.filter(r => r.status === 'DESIGN_IN_PROGRESS').length, cls: 'bg-blue-100 text-blue-700' },
            ].map(s => (
              <div key={s.label} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${s.cls}`}>
                {s.label}: {s.value}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-violet-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={load} className="mt-3 text-sm text-red-600 underline cursor-pointer">
              Reintentar
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <Palette size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No tienes solicitudes asignadas aún.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Empresa / Marca', 'Estado', 'Ses. est.', 'Actualizado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map(req => {
                  const statusMeta = STATUS_LABEL[req.status];
                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleRowClick(req.id)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        req.status === 'CHANGES_REQUESTED' ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">#{req.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{req.commercialName}</p>
                        <p className="text-xs text-gray-500">{req.brandName}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {statusMeta ? (
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusMeta.cls}`}>
                            {statusMeta.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{req.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {req.estimatedSessions != null
                          ? `~${req.estimatedSessions.toLocaleString('es-CO')}`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(req.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 h-14 px-6 flex items-center justify-end shrink-0">
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            loading={notifLoading}
            hasMore={hasMore}
            isOpen={isNotificationsOpen}
            onToggle={() => setIsNotificationsOpen(v => !v)}
            onMarkAllAsRead={markAllAsRead}
            onLoadMore={loadMore}
            menuRef={notificationsMenuRef}
            variant="light"
          />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          {content}
        </main>
      </div>
    </div>
  );
};

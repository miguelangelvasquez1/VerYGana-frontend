// components/admin/users/UserManagement.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Eye, Pencil, Send, Ban, Unlock, Gamepad2, ShieldCheck, Users, Briefcase,
  ShieldAlert, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';

import {
  Role, UserState, UserLevel,
  ConsumerSummaryResponseDTO, CommercialSummaryResponseDTO, AdminSummaryResponseDTO,
} from '@/types/User.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { useAdminSectionSearch } from '@/context/AdminSearchContext';
import {
  countActiveUsersByRole, getNewUsers, getConsumers, getAdmins, getCommercials,
  getGameDesigners, getComplianceOfficers,
} from '@/services/admin/AdminUserService';

import RegisterGameDesignerModal from './RegisterGameDesignerModal';
import RegisterComplianceOfficerModal from './RegisterComplianceOfficerModal';
import UserDetailModal from './UserDetailModal';
import EditUserModal from './EditUserModal';
import BlockUnblockModal from './BlockUnblockModal';
import NotifyUserModal from './NotifyUserModal';
import {
  AnyUserRow, TabKey, roleLabel, roleBadgeColor, userStateLabel, userStateColor,
  levelLabel, planLabel, planBadgeColor, getRowRole, getRowTitle,
} from './userMeta';

const PAGE_SIZE = 10;

interface RowTarget {
  role: Role;
  publicId: string;
  displayName: string;
  email: string;
  userState: UserState;
}

const toRowTarget = (row: AnyUserRow, tab: TabKey): RowTarget => ({
  role: getRowRole(row, tab),
  publicId: row.publicId,
  displayName: getRowTitle(row, tab),
  email: row.email,
  userState: row.userState,
});

const ROLE_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: Role.CONSUMER, label: 'Consumidores', icon: Users },
  { key: Role.COMMERCIAL, label: 'Empresarios', icon: Briefcase },
  { key: Role.ADMIN, label: 'Administradores', icon: ShieldAlert },
  { key: Role.GAME_DESIGNER, label: 'Diseñadores de juegos', icon: Gamepad2 },
  { key: Role.COMPLIANCE_OFFICER, label: 'Oficiales de cumplimiento', icon: ShieldCheck },
  { key: 'RECENT', label: 'Nuevos usuarios', icon: Sparkles },
];

const STAT_CARDS: { role: Role; label: string; icon: React.ElementType }[] = [
  { role: Role.CONSUMER, label: 'Consumidores activos', icon: Users },
  { role: Role.COMMERCIAL, label: 'Comerciales activos', icon: Briefcase },
  { role: Role.ADMIN, label: 'Administradores activos', icon: ShieldAlert },
  { role: Role.GAME_DESIGNER, label: 'Game Designers activos', icon: Gamepad2 },
  { role: Role.COMPLIANCE_OFFICER, label: 'Oficiales activos', icon: ShieldCheck },
];

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISO(start), end: toISO(end) };
};

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>(Role.CONSUMER);

  const [items, setItems] = useState<AnyUserRow[]>([]);
  const [meta, setMeta] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stateFilter, setStateFilter] = useState<UserState | ''>('');
  const [levelFilter, setLevelFilter] = useState<UserLevel | ''>('');
  const [planFilter, setPlanFilter] = useState<PlanCode | ''>('');
  const [{ start: startDate, end: endDate }, setDateRange] = useState(defaultDateRange);

  const [roleStats, setRoleStats] = useState<Partial<Record<Role, number>>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<RowTarget | null>(null);
  const [editTarget, setEditTarget] = useState<RowTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<(RowTarget & { action: 'block' | 'unblock' }) | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<{ publicIds: string[]; recipientsLabel: string } | null>(null);

  const searchPlaceholder = activeTab === 'RECENT'
    ? 'Búsqueda no disponible para nuevos registros'
    : `Buscar ${roleLabel[activeTab as Role].toLowerCase()} por email...`;
  const { searchTerm } = useAdminSectionSearch(searchPlaceholder);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ================== STATS ================== */

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const roles = Object.values(Role);
      const counts = await Promise.all(roles.map((r) => countActiveUsersByRole(r).catch(() => 0)));
      const next: Partial<Record<Role, number>> = {};
      roles.forEach((r, i) => { next[r] = counts[i]; });
      setRoleStats(next);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  /* ================== LIST ================== */

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'RECENT') {
        const res = await getNewUsers(startDate, endDate, page, PAGE_SIZE);
        setItems(res.data);
        setMeta(res.meta);
      } else if (activeTab === Role.CONSUMER) {
        const res = await getConsumers(
          levelFilter || undefined, debouncedSearch || undefined, stateFilter || undefined,
          undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
          page, PAGE_SIZE,
        );
        setItems(res.data);
        setMeta(res.meta);
      } else if (activeTab === Role.COMMERCIAL) {
        const res = await getCommercials(
          debouncedSearch || undefined, stateFilter || undefined, undefined, undefined,
          planFilter || undefined, page, PAGE_SIZE,
        );
        setItems(res.data);
        setMeta(res.meta);
      } else if (activeTab === Role.ADMIN) {
        const res = await getAdmins(debouncedSearch || undefined, stateFilter || undefined, undefined, page, PAGE_SIZE);
        setItems(res.data);
        setMeta(res.meta);
      } else if (activeTab === Role.GAME_DESIGNER) {
        const res = await getGameDesigners(debouncedSearch || undefined, stateFilter || undefined, undefined, undefined, page, PAGE_SIZE);
        setItems(res.data);
        setMeta(res.meta);
      } else if (activeTab === Role.COMPLIANCE_OFFICER) {
        const res = await getComplianceOfficers(debouncedSearch || undefined, stateFilter || undefined, undefined, undefined, page, PAGE_SIZE);
        setItems(res.data);
        setMeta(res.meta);
      }
    } catch {
      setError('No se pudo cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, stateFilter, levelFilter, planFilter, startDate, endDate]);

  useEffect(() => { loadList(); }, [loadList]);

  const refreshAll = () => { loadList(); loadStats(); };

  /* ================== HANDLERS ================== */

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(0);
    setStateFilter('');
    setLevelFilter('');
    setPlanFilter('');
    setSelectedIds(new Set());
  };

  const goToPage = (p: number) => {
    setPage(p);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.publicId))));
  };

  const openDetail = (row: AnyUserRow) => setDetailTarget(toRowTarget(row, activeTab));
  const openEdit = (row: AnyUserRow) => setEditTarget(toRowTarget(row, activeTab));
  const openBlockToggle = (row: AnyUserRow) => setBlockTarget({
    ...toRowTarget(row, activeTab),
    action: row.userState === UserState.BLOCKED ? 'unblock' : 'block',
  });
  const openNotifySingle = (row: AnyUserRow) => setNotifyTarget({
    publicIds: [row.publicId],
    recipientsLabel: getRowTitle(row, activeTab),
  });
  const openNotifyBulk = () => setNotifyTarget({
    publicIds: Array.from(selectedIds),
    recipientsLabel: `${selectedIds.size} usuario${selectedIds.size === 1 ? '' : 's'} seleccionado${selectedIds.size === 1 ? '' : 's'}`,
  });

  const renderInfoCell = (row: AnyUserRow) => {
    if (activeTab === 'RECENT') {
      const role = row.role;
      return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleBadgeColor[role]}`}>{roleLabel[role]}</span>;
    }
    switch (activeTab) {
      case Role.CONSUMER: {
        const r = row as ConsumerSummaryResponseDTO;
        return <span className="text-sm text-gray-600">{r.municipalityName}, {r.departmentName}</span>;
      }
      case Role.COMMERCIAL: {
        const r = row as CommercialSummaryResponseDTO;
        return r.currentPlan ? (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${planBadgeColor[r.currentPlan.planCode]}`}>
            {planLabel[r.currentPlan.planCode]}
          </span>
        ) : <span className="text-xs text-gray-400">Sin plan</span>;
      }
      case Role.ADMIN:
        return <span className="text-sm text-gray-600 font-mono">{(row as AdminSummaryResponseDTO).adminCode}</span>;
      default:
        return <span className="text-xs text-gray-400">—</span>;
    }
  };

  const totalActive = Object.values(roleStats).reduce((sum: number, v) => sum + (v ?? 0), 0);

  /* ================== RENDER ================== */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {statsLoading ? 'Calculando usuarios activos...' : `${totalActive} usuarios activos en total`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshAll}
            title="Actualizar"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowDesignerModal(true)}
            className="bg-admin-gold text-white px-4 py-2 rounded-lg hover:bg-admin-gold/90 flex items-center space-x-2 cursor-pointer"
          >
            <Gamepad2 size={20} />
            <span>Registrar Game Designer</span>
          </button>
          <button
            onClick={() => setShowComplianceModal(true)}
            className="bg-admin-midnight text-white px-4 py-2 rounded-lg hover:bg-admin-midnight/90 flex items-center space-x-2 cursor-pointer"
          >
            <ShieldCheck size={20} />
            <span>Registrar Oficial de Cumplimiento</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(({ role, label, icon: Icon }) => (
          <div key={role} className="bg-white p-5 rounded-lg shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded ${roleBadgeColor[role]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? <Loader2 className="animate-spin" size={18} /> : roleStats[role] ?? 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200">
        {ROLE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === key
                ? 'border-admin-blue text-admin-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-end gap-4">
        {activeTab === 'RECENT' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setDateRange((prev) => ({ ...prev, start: e.target.value })); setPage(0); }}
                className="border px-3 py-1.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setDateRange((prev) => ({ ...prev, end: e.target.value })); setPage(0); }}
                className="border px-3 py-1.5 rounded-lg text-sm"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value as UserState | ''); setPage(0); }}
              className="border px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            >
              <option value="">Todos</option>
              {Object.values(UserState).map((s) => (
                <option key={s} value={s}>{userStateLabel[s]}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === Role.CONSUMER && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nivel</label>
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value as UserLevel | ''); setPage(0); }}
              className="border px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            >
              <option value="">Todos</option>
              {Object.values(UserLevel).map((l) => (
                <option key={l} value={l}>{levelLabel[l]}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === Role.COMMERCIAL && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value as PlanCode | ''); setPage(0); }}
              className="border px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            >
              <option value="">Todos</option>
              {Object.values(PlanCode).map((p) => (
                <option key={p} value={p}>{planLabel[p]}</option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs text-gray-400 ml-auto">
          {meta.totalElements} resultado{meta.totalElements === 1 ? '' : 's'}
        </p>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-admin-blue/5 border border-admin-blue/20 rounded-lg px-4 py-2.5">
          <p className="text-sm text-admin-blue font-medium">
            {selectedIds.size} usuario{selectedIds.size === 1 ? '' : 's'} seleccionado{selectedIds.size === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={openNotifyBulk}
              className="flex items-center gap-1 text-xs font-medium text-white bg-admin-blue px-3 py-1.5 rounded-lg hover:bg-admin-blue-dark cursor-pointer"
            >
              <Send size={14} /> Notificar seleccionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-admin-blue" size={28} />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={loadList} className="mt-3 text-sm text-red-600 underline cursor-pointer">Reintentar</button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No hay usuarios con estos filtros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === items.length}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'RECENT' ? 'Rol' : 'Info'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((user) => {
                  const title = getRowTitle(user, activeTab);
                  return (
                    <tr key={user.publicId} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.publicId)}
                          onChange={() => toggleSelect(user.publicId)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-gray-700">{title.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{title}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userStateColor[user.userState]}`}>
                          {userStateLabel[user.userState]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{renderInfoCell(user)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button onClick={() => openDetail(user)} title="Ver detalle" className="text-gray-500 hover:text-admin-blue cursor-pointer">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEdit(user)} title="Editar" className="text-admin-midnight hover:text-admin-blue cursor-pointer">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => openNotifySingle(user)} title="Enviar notificación" className="text-admin-blue hover:text-admin-blue-dark cursor-pointer">
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => openBlockToggle(user)}
                            title={user.userState === UserState.BLOCKED ? 'Reactivar' : 'Bloquear'}
                            className={user.userState === UserState.BLOCKED ? 'text-green-600 hover:text-green-800 cursor-pointer' : 'text-red-600 hover:text-red-800 cursor-pointer'}
                          >
                            {user.userState === UserState.BLOCKED ? <Unlock size={16} /> : <Ban size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Página {page + 1} de {meta.totalPages} · {meta.totalElements} usuario{meta.totalElements === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              onClick={() => goToPage(Math.min(meta.totalPages - 1, page + 1))}
              disabled={page >= meta.totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <RegisterGameDesignerModal
        isOpen={showDesignerModal}
        onClose={() => { setShowDesignerModal(false); refreshAll(); }}
      />
      <RegisterComplianceOfficerModal
        isOpen={showComplianceModal}
        onClose={() => { setShowComplianceModal(false); refreshAll(); }}
      />

      <UserDetailModal
        isOpen={!!detailTarget}
        role={detailTarget?.role ?? Role.CONSUMER}
        publicId={detailTarget?.publicId ?? ''}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { if (detailTarget) { setEditTarget(detailTarget); setDetailTarget(null); } }}
        onNotify={() => {
          if (detailTarget) {
            setNotifyTarget({ publicIds: [detailTarget.publicId], recipientsLabel: detailTarget.displayName });
            setDetailTarget(null);
          }
        }}
        onToggleBlock={() => {
          if (detailTarget) {
            setBlockTarget({ ...detailTarget, action: detailTarget.userState === UserState.BLOCKED ? 'unblock' : 'block' });
            setDetailTarget(null);
          }
        }}
      />

      <EditUserModal
        isOpen={!!editTarget}
        role={editTarget?.role ?? Role.CONSUMER}
        publicId={editTarget?.publicId ?? ''}
        displayName={editTarget?.displayName ?? ''}
        currentEmail={editTarget?.email ?? ''}
        onClose={() => setEditTarget(null)}
        onSuccess={loadList}
      />

      <BlockUnblockModal
        isOpen={!!blockTarget}
        action={blockTarget?.action ?? 'block'}
        publicId={blockTarget?.publicId ?? ''}
        displayName={blockTarget?.displayName ?? ''}
        onClose={() => setBlockTarget(null)}
        onSuccess={refreshAll}
      />

      <NotifyUserModal
        isOpen={!!notifyTarget}
        publicIds={notifyTarget?.publicIds ?? []}
        recipientsLabel={notifyTarget?.recipientsLabel ?? ''}
        onClose={() => setNotifyTarget(null)}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </div>
  );
};

export default UserManagement;

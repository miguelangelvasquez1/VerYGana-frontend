'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImpactStoryForm from '@/components/Admin/forum/ImpactStoryForm';
import ImpactStoryEditForm from '@/components/Admin/forum/ImpactStoryEditForm';
import StoryRow from '@/components/Admin/forum/StoryRow';
import { useImpactStories, useDeleteImpactStory } from '@/hooks/useImpactStory';
import type { ImpactStoryResponse, StoryStatus, ImpactStoryFilters } from '@/types/impactStory.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'list' | 'create' | 'edit';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminImpactStoriesPage() {
  const [view, setView]                 = useState<View>('list');
  const [editing, setEditing]           = useState<ImpactStoryResponse | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ImpactStoryResponse | null>(null);
  const [filters, setFilters]           = useState<ImpactStoryFilters>({ size: 10, page: 0 });
  const [search, setSearch]             = useState('');

  const { data, isLoading, isError } = useImpactStories(filters);
  const deleteMutation = useDeleteImpactStory();

  const stories     = data?.content    ?? [];
  const totalPages  = data?.totalPages ?? 1;
  const currentPage = data?.number     ?? 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleEdit = (story: ImpactStoryResponse) => {
    setEditing(story);
    setView('edit');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleBackToList = () => {
    setView('list');
    setEditing(undefined);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: search || undefined, page: 0 }));
  };

  // ── Sub-views ───────────────────────────────────────────────────────────────

  if (view === 'create') {
    return (
      <AdminLayout>
        <ImpactStoryForm onSuccess={handleBackToList} onCancel={handleBackToList} />
      </AdminLayout>
    );
  }

  if (view === 'edit' && editing) {
    return (
      <AdminLayout>
        <ImpactStoryEditForm
          story={editing}
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
      </AdminLayout>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Historias de Impacto
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {data?.totalElements ?? 0} historias en total
            </p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva historia
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors">
              Buscar
            </button>
          </form>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white text-gray-700"
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: (e.target.value as StoryStatus) || undefined, page: 0 }))
            }
          >
            <option value="">Todos los estados</option>
            <option value="PUBLISHED">Publicadas</option>
            <option value="DRAFT">Borradores</option>
            <option value="ARCHIVED">Archivadas</option>
          </select>

          {(filters.status || filters.search) && (
            <button
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
              onClick={() => { setFilters({ size: 10, page: 0 }); setSearch(''); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <svg className="w-5 h-5 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3}/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
              </svg>
              <span className="text-sm">Cargando historias...</span>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-3 m-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              No se pudieron cargar las historias. Intenta de nuevo.
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && stories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">
                No hay historias{filters.status || filters.search ? ' con estos filtros' : ' aún'}
              </p>
              <button
                onClick={() => setView('create')}
                className="mt-4 text-sm text-emerald-700 hover:text-emerald-900 font-semibold underline transition-colors"
              >
                Crear la primera historia
              </button>
            </div>
          )}

          {/* Table */}
          {!isLoading && stories.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Media</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Historia</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Beneficiados</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Inversión</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stories.map((story) => (
                    <StoryRow
                      key={story.id}
                      story={story}
                      onEdit={() => handleEdit(story)}
                      onDelete={() => setDeleteTarget(story)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400">
                Página {currentPage + 1} de {totalPages}
              </p>
              <div className="flex gap-1.5">
                <PaginationBtn
                  disabled={currentPage === 0}
                  onClick={() => setFilters((f) => ({ ...f, page: currentPage - 1 }))}
                  label="← Anterior"
                />
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = Math.max(0, currentPage - 2) + i;
                  if (page >= totalPages) return null;
                  return (
                    <PaginationBtn
                      key={page}
                      active={page === currentPage}
                      onClick={() => setFilters((f) => ({ ...f, page }))}
                      label={String(page + 1)}
                    />
                  );
                })}
                <PaginationBtn
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setFilters((f) => ({ ...f, page: currentPage + 1 }))}
                  label="Siguiente →"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteTarget.title}
          isLoading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}

// ─── Pagination button ────────────────────────────────────────────────────────

function PaginationBtn({
  onClick, label, disabled = false, active = false,
}: {
  onClick: () => void; label: string; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
        ${active
          ? 'bg-emerald-700 text-white border-emerald-700'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  title, isLoading, onConfirm, onCancel,
}: {
  title: string; isLoading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Eliminar historia</h3>
            <p className="text-sm text-gray-500 mt-1">
              ¿Estás seguro de eliminar{' '}
              <span className="font-semibold text-gray-700">"{title}"</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3}/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
              </svg>
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
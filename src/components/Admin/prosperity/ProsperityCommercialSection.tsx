'use client';

import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, Loader2, Search, X } from 'lucide-react';
import { getCommercials } from '@/services/admin/AdminUserService';
import type { CommercialSummaryResponseDTO } from '@/types/User.types';
import { AdminProsperityTab } from './AdminProsperityTab';

const RESULTS_SIZE = 8;

// Prosperidad por empresario dentro de Finanzas: se busca al empresario y se
// muestra el mismo panel que la pestaña "Prosperidad" del detalle de usuario
// (resumen, Umbrales, Libro Mayor, reversión y ajustes).
export function ProsperityCommercialSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<CommercialSummaryResponseDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'prosperity', 'commercial-search', debouncedSearch],
    queryFn: () => getCommercials(debouncedSearch || undefined, undefined, undefined, 0, RESULTS_SIZE),
    enabled: !selected,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const results = data?.data ?? [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-admin-blue/10 p-2">
          <Building2 className="h-5 w-5 text-admin-blue" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Saldo de Prosperidad por empresario</h3>
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-gray-500">
            Consulta el resumen y el Libro Mayor de un empresario, revierte un Umbral o registra un ajuste.
          </p>
        </div>
      </div>

      {selected ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-blue/20 bg-admin-blue/5 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{selected.companyName || selected.email}</p>
              <p className="truncate text-xs text-gray-500">
                {selected.nit ? `NIT ${selected.nit} · ` : ''}
                {selected.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" /> Cambiar empresario
            </button>
          </div>
          <div className="mt-5">
            {/* key: reinicia página del Libro Mayor y alertas al cambiar de empresario. */}
            <AdminProsperityTab key={selected.publicId} publicId={selected.publicId} />
          </div>
        </>
      ) : (
        <>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresario por email..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 outline-none focus:border-admin-blue focus:ring-2 focus:ring-admin-blue/20"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-300" />
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-admin-blue" />
            </div>
          ) : isError ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No se pudieron cargar los empresarios.
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No se encontraron empresarios.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
              {results.map((c) => (
                <li key={c.publicId}>
                  <button
                    type="button"
                    onClick={() => setSelected(c)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{c.companyName || c.email}</p>
                      <p className="truncate text-xs text-gray-500">
                        {c.nit ? `NIT ${c.nit} · ` : ''}
                        {c.email}
                      </p>
                    </div>
                    {c.currentPlan?.planName && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {c.currentPlan.planName}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

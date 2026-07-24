'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCommercialSurveys } from '@/hooks/surveys/useCommercialSurvey';
import { STATUS_LABELS } from '@/hooks/surveys/surveyUtils';
import SurveyTable from './SurveyTable';
import type { SurveyStatus } from '@/types/survey.types';

const ALL_STATUSES: SurveyStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'COMPLETED', 'CLOSED'];

export default function SurveyManagement() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError } = useCommercialSurveys(page, 10, statusFilter);

  const filteredSurveys = useMemo(
    () => (data?.data ?? []).filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [data?.data, searchTerm],
  );

  return (
    <div className="space-y-6">
      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar encuestas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <select
                value={statusFilter ?? 'all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatusFilter(v === 'all' ? undefined : (v as SurveyStatus));
                  setPage(0);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
              >
                <option value="all">Todos los estados</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón crear encuesta */}
          <button
            onClick={() => router.push('/commercial/surveys/new')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#03548C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0b1440] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva encuesta
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          Error al cargar las encuestas. Intenta de nuevo.
        </div>
      ) : (
        <SurveyTable
          surveys={filteredSurveys}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

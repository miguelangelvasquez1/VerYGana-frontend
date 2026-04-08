'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCommercialSurveys } from '@/hooks/surveys/useCommercialSurvey';
import SurveyTable from './SurveyTable';
import SurveyFormModal from './SurveyFormModal';
import SurveyStatusFilter from './SurveyStatusFIlter';
import type { SurveyStatus } from '@/types/survey.types';

export default function SurveyManagement() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, isError } = useCommercialSurveys(page, 10, statusFilter);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Encuestas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea y gestiona encuestas con recompensas para usuarios
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva encuesta
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <SurveyStatusFilter
        value={statusFilter}
        onChange={(s) => {
          setStatusFilter(s);
          setPage(0);
        }}
      />

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          Error al cargar las encuestas. Intenta de nuevo.
        </div>
      ) : (
        <SurveyTable
          surveys={data?.data ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
        />
      )}

      {/* ── Create Modal ────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <SurveyFormModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
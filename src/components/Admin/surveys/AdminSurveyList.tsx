'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  useAdminSurveyList,
  useAdminUpdateStatus,
  SurveyApiError,
} from '@/hooks/surveys/useAdminSurvey';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  formatReward,
  formatDate,
  getResponseProgress,
} from '@/hooks/surveys/surveyUtils';
import type { SurveyStatus } from '@/types/survey.types';
import type { AdminSurveySummary } from '@/types/survey.types';

// ─── Status filter pills ──────────────────────────────────────────────────────

const ALL_STATUSES: SurveyStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSurveyList() {
  const router = useRouter();
  const [page,          setPage]          = useState(0);
  const [statusFilter,  setStatusFilter]  = useState<SurveyStatus | undefined>();
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminSurveyList(page, 15, statusFilter);
  const updateStatus = useAdminUpdateStatus();

  const handleStatusChange = (surveyId: number, status: SurveyStatus) => {
    setErrorMsg(null);
    updateStatus.mutate(
      { surveyId, status },
      {
        onError: (err:any) => {
          setErrorMsg(
            err instanceof SurveyApiError
              ? err.message
              : 'Error al actualizar el estado',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          Encuestas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa y gestiona el estado de todas las encuestas de la plataforma.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <FilterPill
          label="Todas"
          active={!statusFilter}
          onClick={() => { setStatusFilter(undefined); setPage(0); }}
        />
        {ALL_STATUSES.map((s) => (
          <FilterPill
            key={s}
            label={STATUS_LABELS[s]}
            active={statusFilter === s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
          />
        ))}
      </div>

      {/* ── Mutation error ─────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* ── Fetch error ────────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center text-sm text-red-600">
          No se pudieron cargar las encuestas. Intenta de nuevo.
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────────────────────── */}
      {!isLoading && !isError && data?.data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20">
          <ClipboardList className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            No hay encuestas{statusFilter ? ` con estado "${STATUS_LABELS[statusFilter]}"` : ''}
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {!isLoading && !isError && data && data.data?.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {['Encuesta', 'Estado', 'Respuestas', 'Recompensa', 'Creada', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((survey:any) => (
                  <SurveyRow
                    key={survey.id}
                    survey={survey}
                    isUpdating={
                      updateStatus.isPending &&
                      updateStatus.variables?.surveyId === survey.id
                    }
                    onViewDetail={() =>
                      router.push(`/admin/surveys/${survey.id}`)
                    }
                    onStatusChange={(status) =>
                      handleStatusChange(survey.id, status)
                    }
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  {data.meta.totalElements.toLocaleString('es-CO')} encuestas ·
                  Página {page + 1} de {data.meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= data.meta.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SurveyRow ────────────────────────────────────────────────────────────────

function SurveyRow({
  survey,
  isUpdating,
  onViewDetail,
  onStatusChange,
}: {
  survey: AdminSurveySummary;
  isUpdating: boolean;
  onViewDetail: () => void;
  onStatusChange: (status: SurveyStatus) => void;
}) {
  const progress = getResponseProgress(survey.totalResponses, survey.maxResponses);

  return (
    <tr className="group hover:bg-gray-50 transition-colors">

      {/* Title */}
      <td className="max-w-[260px] px-5 py-4">
        <button
          onClick={onViewDetail}
          className="text-left"
        >
          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {survey.title}
          </p>
          {survey.categoryNames?.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {survey.categoryNames.slice(0, 2).join(', ')}
              {survey.categoryNames?.length > 2 && ` +${survey.categoryNames.length - 2}`}
            </p>
          )}
        </button>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[survey.status]}`}>
          {STATUS_LABELS[survey.status]}
        </span>
      </td>

      {/* Responses */}
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-900">
          {survey.totalResponses.toLocaleString('es-CO')}
          {survey.maxResponses && (
            <span className="font-normal text-gray-400">
              {' '}/ {survey.maxResponses.toLocaleString('es-CO')}
            </span>
          )}
        </p>
        {survey.maxResponses && (
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </td>

      {/* Reward */}
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-indigo-600">
          {formatReward(survey.rewardAmount)}
        </p>
      </td>

      {/* Created */}
      <td className="px-5 py-4 text-xs text-gray-500">
        {formatDate(survey.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

          {/* Detail */}
          <ActionBtn tooltip="Ver detalle" onClick={onViewDetail}>
            <Eye className="h-3.5 w-3.5" />
          </ActionBtn>

          {/* DRAFT → publish */}
          {survey.status === 'DRAFT' && (
            <ActionBtn
              tooltip="Publicar"
              loading={isUpdating}
              className="text-emerald-600 hover:bg-emerald-50"
              onClick={() => onStatusChange('ACTIVE')}
            >
              <Play className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {/* ACTIVE → pause */}
          {survey.status === 'ACTIVE' && (
            <ActionBtn
              tooltip="Pausar"
              loading={isUpdating}
              className="text-amber-600 hover:bg-amber-50"
              onClick={() => onStatusChange('PAUSED')}
            >
              <Pause className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {/* PAUSED → reactivate */}
          {survey.status === 'PAUSED' && (
            <ActionBtn
              tooltip="Reactivar"
              loading={isUpdating}
              className="text-emerald-600 hover:bg-emerald-50"
              onClick={() => onStatusChange('ACTIVE')}
            >
              <Play className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {/* ACTIVE or PAUSED → close */}
          {(survey.status === 'ACTIVE' || survey.status === 'PAUSED') && (
            <ActionBtn
              tooltip="Cerrar encuesta"
              loading={isUpdating}
              className="text-red-500 hover:bg-red-50"
              onClick={() => onStatusChange('CLOSED')}
            >
              <XCircle className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {survey.status === 'CLOSED' && (
            <span title="Encuesta cerrada">
              <CheckCircle2 className="h-4 w-4 text-gray-300" />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  children, tooltip, onClick, loading = false,
  className = 'text-gray-500 hover:bg-gray-100',
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      title={tooltip}
      onClick={onClick}
      disabled={loading}
      className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : children}
    </button>
  );
}
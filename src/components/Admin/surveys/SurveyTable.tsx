'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Play,
  Pause,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  BarChart2,
} from 'lucide-react';
import { usePublishSurvey, useUpdateSurveyStatus } from '@/hooks/surveys/useAdminSurvey';
import {
  STATUS_LABELS,
  STATUS_COLORS, 
  formatReward,
  formatDate
} from '@/hooks/surveys/surveyUtils';
import SurveyDetailModal from './SurveyDetailModal';
import type { SurveySummary, SurveyStatus } from '@/types/survey.types';

interface Props {
  surveys: SurveySummary[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function SurveyTable({
  surveys,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const router = useRouter();
  const [detailId, setDetailId] = useState<number | null>(null);
  const publishMutation = usePublishSurvey();
  const statusMutation  = useUpdateSurveyStatus();

  const handleStatusChange = (id: number, status: SurveyStatus) => {
    statusMutation.mutate({ surveyId: id, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <ClipboardList className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">
          No hay encuestas con este filtro
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              {['Encuesta', 'Estado', 'Recompensa', 'Respuestas', 'Creada', 'Acciones'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {surveys.map((survey) => (
              <SurveyRow
                key={survey.id}
                survey={survey}
                onView={() => setDetailId(survey.id)}
                onViewResponses={() =>
                  router.push(`/admin/surveys/${survey.id}`)
                }
                onPublish={() => publishMutation.mutate(survey.id)}
                onStatusChange={handleStatusChange}
                isUpdating={
                  (publishMutation.isPending &&
                    publishMutation.variables === survey.id) ||
                  (statusMutation.isPending &&
                    statusMutation.variables?.surveyId === survey.id)
                }
              />
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-500">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailId !== null && (
        <SurveyDetailModal
          surveyId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SurveyRow({
  survey,
  onView,
  onViewResponses,
  onPublish,
  onStatusChange,
  isUpdating,
}: {
  survey: SurveySummary;
  onView: () => void;
  onViewResponses: () => void;
  onPublish: () => void;
  onStatusChange: (id: number, status: SurveyStatus) => void;
  isUpdating: boolean;
}) {
  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      {/* Title */}
      <td className="max-w-xs px-5 py-4">
        <p className="truncate text-sm font-medium text-gray-900">
          {survey.title}
        </p>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[survey.status]}`}
        >
          {STATUS_LABELS[survey.status]}
        </span>
      </td>
      
      {/* Reward */}
      <td className="px-5 py-4 text-sm font-semibold text-indigo-600">
        {formatReward(survey.rewardAmount)}
      </td>

      {/* Responses progress */}
      <td className="px-5 py-4">
        <p className="text-sm text-gray-700">
          {survey.totalResponses}
        </p>
      </td>

      {/* Created */}
      <td className="px-5 py-4 text-xs text-gray-500">
        {survey.createdAt && formatDate(survey.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn tooltip="Ver detalle" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
          </ActionBtn>

          <ActionBtn
            tooltip="Ver respuestas"
            onClick={onViewResponses}
            className="text-violet-600 hover:bg-violet-50"
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </ActionBtn>

          {survey.status === 'DRAFT' && (
            <ActionBtn
              tooltip="Publicar"
              onClick={onPublish}
              loading={isUpdating}
              className="text-emerald-600 hover:bg-emerald-50"
            >
              <Play className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {survey.status === 'ACTIVE' && (
            <ActionBtn
              tooltip="Pausar"
              onClick={() => onStatusChange(survey.id, 'PAUSED')}
              loading={isUpdating}
              className="text-amber-600 hover:bg-amber-50"
            >
              <Pause className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {survey.status === 'PAUSED' && (
            <ActionBtn
              tooltip="Reactivar"
              onClick={() => onStatusChange(survey.id, 'ACTIVE')}
              loading={isUpdating}
              className="text-emerald-600 hover:bg-emerald-50"
            >
              <Play className="h-3.5 w-3.5" />
            </ActionBtn>
          )}

          {['ACTIVE', 'PAUSED'].includes(survey.status) && (
            <ActionBtn
              tooltip="Cerrar"
              onClick={() => onStatusChange(survey.id, 'CLOSED')}
              loading={isUpdating}
              className="text-red-500 hover:bg-red-50"
            >
              <XCircle className="h-3.5 w-3.5" />
            </ActionBtn>
          )}
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({
  children,
  tooltip,
  onClick,
  loading,
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
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
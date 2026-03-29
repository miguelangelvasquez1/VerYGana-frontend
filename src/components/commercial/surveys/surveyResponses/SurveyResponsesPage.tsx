'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Table2,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  useSurveyAnalytics,
  useSurveyResponses,
  useExportResponses,
} from '@/hooks/surveys/useCommercialSurvey';
import { SurveyApiError } from '@/services/surveyService';
import ResponsesTable from './ResponsesTable';
import AnalyticsPanel from './AnalyticsPanel';

interface Props {
  surveyId: number;
  surveyTitle: string;
  onBack: () => void;
}

type Tab = 'analytics' | 'responses';

export default function SurveyResponsesPage({ surveyId, surveyTitle, onBack }: Props) {
  const [tab,  setTab]  = useState<Tab>('analytics');
  const [page, setPage] = useState(0);
  const SIZE = 20;

  const analyticsQuery = useSurveyAnalytics(surveyId);
  const responsesQuery = useSurveyResponses(surveyId, page, SIZE);
  const exportMutation = useExportResponses();

  const totalResponses = analyticsQuery.data?.totalResponses ?? 0;

  const handleExport = (format: 'csv' | 'xlsx') =>
    exportMutation.mutate({ surveyId, surveyTitle, format });

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Volver a encuestas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Encuesta
            </p>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {surveyTitle}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {analyticsQuery.isLoading
                ? '—'
                : `${totalResponses.toLocaleString('es-CO')} respuestas`}
            </p>
          </div>
        </div>

        {/* Export */}
        <div className="flex flex-wrap items-center gap-2">
          <ExportBtn
            label="CSV"
            icon={<FileText className="h-3.5 w-3.5" />}
            loading={exportMutation.isPending && exportMutation.variables?.format === 'csv'}
            disabled={exportMutation.isPending || totalResponses === 0}
            onClick={() => handleExport('csv')}
          />
          <ExportBtn
            label="Excel"
            icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
            loading={exportMutation.isPending && exportMutation.variables?.format === 'xlsx'}
            disabled={exportMutation.isPending || totalResponses === 0}
            onClick={() => handleExport('xlsx')}
            primary
          />
          {exportMutation.isError && (
            <span className="text-xs text-red-500">
              {exportMutation.error instanceof SurveyApiError
                ? exportMutation.error.message
                : 'Error al exportar'}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 w-fit rounded-xl border border-gray-200 bg-gray-50 p-1">
        <TabBtn active={tab === 'analytics'} onClick={() => setTab('analytics')}
          icon={<BarChart2 className="h-4 w-4" />} label="Gráficas" />
        <TabBtn active={tab === 'responses'} onClick={() => setTab('responses')}
          icon={<Table2 className="h-4 w-4" />} label="Respuestas individuales" />
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {tab === 'analytics'  && <AnalyticsPanel  query={analyticsQuery} />}
      {tab === 'responses'  && (
        <ResponsesTable
          query={responsesQuery}
          page={page}
          size={SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}{label}
    </button>
  );
}

function ExportBtn({ label, icon, loading, disabled, onClick, primary = false }: {
  label: string; icon: React.ReactNode;
  loading: boolean; disabled: boolean;
  onClick: () => void; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 ${
        primary
          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
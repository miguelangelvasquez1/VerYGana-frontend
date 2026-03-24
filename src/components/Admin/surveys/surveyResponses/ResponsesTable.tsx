'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  InboxIcon,
} from 'lucide-react';
import { formatDateTime } from '@/hooks/surveys/surveyUtils';
import type { UseQueryResult } from '@tanstack/react-query';
import type { SurveyResponseDetail } from '@/types/survey.types';
import { PagedResponse } from '@/types/GenericTypes';

interface Props {
  query: UseQueryResult<PagedResponse<SurveyResponseDetail>>;
  page: number;
  size: number;
  onPageChange: (p: number) => void;
}

export default function ResponsesTable({ query, page, size, onPageChange }: Props) {
  const { data, isLoading } = query;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!data || data.data?.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <InboxIcon className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">
          Aún no hay respuestas registradas
        </p>
      </div>
    );
  }

  const from = page * size + 1;
  const to   = Math.min(from + data.data?.length - 1, data.meta.totalElements);

  return (
    <div className="space-y-3">
      {/* Results count */}
      <p className="text-xs text-gray-400">
        Mostrando {from}–{to} de {data.meta.totalElements.toLocaleString('es-CO')} respuestas
      </p>

      {/* Response cards */}
      <div className="space-y-2">
        {data.data?.map((response, idx) => (
          <ResponseCard key={response.id} response={response} index={from + idx - 1} />
        ))}
      </div>

      {/* Pagination */}
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3">
          <p className="text-xs text-gray-500">
            Página {page + 1} de {data.meta.totalPages}
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
              disabled={page === data.meta.totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ResponseCard ─────────────────────────────────────────────────────────────

function ResponseCard({
  response,
  index,
}: {
  response: SurveyResponseDetail;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Index */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
          {index}
        </span>

        {/* User */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {response.userName ?? `Usuario #${response.userId}`}
          </p>
          <p className="text-xs text-gray-400">
            {response.completedAt
              ? `Completada ${formatDateTime(response.completedAt)}`
              : `Iniciada ${formatDateTime(response.startedAt)}`}
          </p>
        </div>

        {/* Status pill */}
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          response.status === 'REWARDED'  ? 'bg-emerald-50 text-emerald-700' :
          response.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-600'  :
                                            'bg-amber-50 text-amber-600'
        }`}>
          {response.status === 'REWARDED'  ? 'Recompensada' :
           response.status === 'COMPLETED' ? 'Completada'    : 'En progreso'}
        </span>

        {/* Toggle */}
        {expanded
          ? <ChevronUp   className="h-4 w-4 shrink-0 text-gray-400" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
      </button>

      {/* Answers */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {response.answers.map((answer) => (
            <div key={answer.questionId} className="px-5 py-3">
              <p className="mb-1 text-xs font-medium text-gray-500">
                {answer.questionText}
              </p>
              <AnswerDisplay answer={answer} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AnswerDisplay ────────────────────────────────────────────────────────────

function AnswerDisplay({ answer }: { answer: SurveyResponseDetail['answers'][number] }) {
  if (answer.questionType === 'TEXT') {
    return (
      <p className="text-sm text-gray-700 italic">
        "{answer.textAnswer ?? '—'}"
      </p>
    );
  }

  if (answer.questionType === 'RATING') {
    const val = parseInt(answer.textAnswer ?? '0');
    const EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
    return (
      <div className="flex items-center gap-2">
        <span className="text-xl">{EMOJIS[val - 1] ?? '—'}</span>
        <span className="text-sm font-semibold text-gray-800">{val}/5</span>
      </div>
    );
  }

  if (answer.questionType === 'MULTIPLE_CHOICE' && answer.selectedOptionTexts.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {answer.selectedOptionTexts.map((t) => (
          <span key={t} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {t}
          </span>
        ))}
      </div>
    );
  }

  // SINGLE_CHOICE, YES_NO — try selectedOptionText first, fall back to textAnswer
  const choiceText = answer.selectedOptionText ?? answer.textAnswer;
  if (answer.questionType === 'SINGLE_CHOICE' || answer.questionType === 'YES_NO') {
    if (!choiceText) return <span className="text-xs text-gray-400">Sin respuesta</span>;

    const isYes = /^(si|sí|yes|true|1)$/i.test(choiceText);
    const isNo  = /^(no|false|0)$/i.test(choiceText);

    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        answer.questionType === 'YES_NO'
          ? isYes ? 'bg-emerald-50 text-emerald-700'
          : isNo  ? 'bg-red-50 text-red-600'
                  : 'bg-indigo-50 text-indigo-700'
          : 'bg-indigo-50 text-indigo-700'
      }`}>
        {choiceText}
      </span>
    );
  }

  return <span className="text-xs text-gray-400">Sin respuesta</span>;
}
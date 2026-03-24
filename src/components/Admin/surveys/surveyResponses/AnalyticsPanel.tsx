'use client';

import React from 'react';
import { Loader2, AlertCircle, BarChart2, Star, MessageSquare } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { SurveyAnalytics, QuestionStat } from '@/types/survey.types';

interface Props {
  query: UseQueryResult<SurveyAnalytics>;
}

export default function AnalyticsPanel({ query }: Props) {
  const { data, isLoading, isError } = query;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
        <AlertCircle className="h-4 w-4 shrink-0" />
        No se pudieron cargar las estadísticas. Intenta de nuevo.
      </div>
    );
  }

  if (data.totalResponses === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <BarChart2 className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">
          Las gráficas aparecerán cuando haya respuestas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Summary row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total respuestas"    value={data.totalResponses.toLocaleString('es-CO')} />
        <StatCard label="Completadas"         value={data.completedResponses.toLocaleString('es-CO')} />
        <StatCard
          label="Tasa de completado"
          value={`${data.completionRate.toFixed(1)}%`}
          accent
        />
        <StatCard
          label="Tiempo promedio"
          value={
            data.averageCompletionMinutes != null
              ? `${data.averageCompletionMinutes.toFixed(1)} min`
              : '—'
          }
        />
      </div>

      {/* ── Per-question charts ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {data.questionStats.map((stat, i) => (
          <QuestionChart key={stat.questionId} stat={stat} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, accent = false,
}: {
  label: string; value: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-indigo-100 bg-indigo-50' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-black ${accent ? 'text-indigo-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

// ─── QuestionChart ────────────────────────────────────────────────────────────

function QuestionChart({ stat, index }: { stat: QuestionStat; index: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Question header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          {index}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {stat.questionText}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {stat.totalAnswers.toLocaleString('es-CO')} respuesta{stat.totalAnswers !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Chart by type */}
      {(stat.questionType === 'SINGLE_CHOICE' ||
        stat.questionType === 'MULTIPLE_CHOICE' ||
        stat.questionType === 'YES_NO') && (
        <BarChart stat={stat} />
      )}

      {stat.questionType === 'RATING' && (
        <RatingChart stat={stat} />
      )}

      {stat.questionType === 'TEXT' && (
        <TextAnswers stat={stat} />
      )}
    </div>
  );
}

// ─── BarChart (for choice / yes-no questions) ─────────────────────────────────

function BarChart({ stat }: { stat: QuestionStat }) {
  if (stat.optionStats.length === 0) {
    return <p className="text-xs text-gray-400">Sin datos</p>;
  }

  const maxCount = Math.max(...stat.optionStats.map((o) => o.count), 1);
  const isYesNo  = stat.questionType === 'YES_NO';

  return (
    <div className="space-y-2.5">
      {stat.optionStats.map((opt) => {
        const pct = (opt.count / maxCount) * 100;
        const isPositive = isYesNo && /^(si|sí|yes|1)$/i.test(opt.optionText);

        return (
          <div key={opt.optionText}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-gray-700">{opt.optionText}</span>
              <span className="ml-4 shrink-0 text-sm font-bold text-gray-900">
                {opt.percentage.toFixed(1)}%
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({opt.count.toLocaleString('es-CO')})
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isYesNo
                    ? isPositive
                      ? 'bg-emerald-500'
                      : 'bg-red-400'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RatingChart ──────────────────────────────────────────────────────────────

const RATING_EMOJIS  = ['😞', '😕', '😐', '🙂', '😄'];
const RATING_COLORS  = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500',
];

function RatingChart({ stat }: { stat: QuestionStat }) {
  const avg = stat.averageRating;

  // Build option stats for ratings 1-5 even if some are missing
  const ratingMap = Object.fromEntries(
    stat.optionStats.map((o) => [o.optionText, o]),
  );
  const maxCount = Math.max(...stat.optionStats.map((o) => o.count), 1);

  return (
    <div className="space-y-4">
      {/* Average display */}
      {avg !== null && (
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">
              {avg.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">promedio de {stat.totalAnswers} respuestas</p>
          </div>
        </div>
      )}

      {/* Distribution bars */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const opt   = ratingMap[String(n)];
          const count = opt?.count ?? 0;
          const pct   = (count / maxCount) * 100;
          return (
            <div key={n} className="flex items-center gap-3">
              <span className="w-6 text-center text-base">{RATING_EMOJIS[n - 1]}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${RATING_COLORS[n - 1]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TextAnswers ──────────────────────────────────────────────────────────────

function TextAnswers({ stat }: { stat: QuestionStat }) {
  if (!stat.textAnswers || stat.textAnswers.length === 0) {
    return <p className="text-xs text-gray-400">Sin respuestas de texto</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>Muestra de respuestas ({stat.textAnswers.length})</span>
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {stat.textAnswers.map((text, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 italic"
          >
            "{text}"
          </div>
        ))}
      </div>
    </div>
  );
}
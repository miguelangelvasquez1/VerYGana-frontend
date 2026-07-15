'use client';

import React, { useMemo, useState } from 'react';
import { useAvailableSurveys } from '@/hooks/surveys/useSurvey';
import SurveyCard from './SurveyCard';
import SurveyPlayerModal from './SurveyPlayerModal';
import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { useXpReward } from '@/hooks/useXpReward';
import { XpRewardToast } from '@/components/levels/XpRewardToast';

export default function SurveyList() {
  const [page, setPage] = useState(0);
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null);
  const { rewardData, showReward, dismiss } = useXpReward();

  const { data, isLoading, isError } = useAvailableSurveys(page, 8);

  // El backend a veces devuelve la misma encuesta más de una vez en una
  // página (fila duplicada por un JOIN sin DISTINCT) — deduplicamos por id
  // para no romper la reconciliación de React con keys repetidas.
  const surveys = useMemo(() => {
    if (!data) return [];
    const seen = new Set<number>();
    return data.data.filter((survey) => {
      if (seen.has(survey.id)) return false;
      seen.add(survey.id);
      return true;
    });
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#03548C]" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          No pudimos cargar las encuestas. Intenta de nuevo más tarde.
        </div>
      )}

      {!isLoading && !isError && data && surveys.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <Inbox className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            No hay encuestas disponibles por ahora
          </p>
          <p className="text-xs text-gray-400">
            Vuelve más tarde, publicamos nuevas encuestas regularmente.
          </p>
        </div>
      )}

      {/* Survey cards */}
      {!isLoading && data && surveys.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey, index) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                rank={page * 8 + index + 1}
                onStart={() => setActiveSurveyId(survey.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:border-[#03548C]/30 hover:bg-[#03548C]/5 hover:text-[#03548C] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">
                {page + 1} / {data.meta.totalPages}
              </span>
              <button
                disabled={page >= data.meta.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:border-[#03548C]/30 hover:bg-[#03548C]/5 hover:text-[#03548C] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Survey player modal */}
      {activeSurveyId !== null && (
        <SurveyPlayerModal
          surveyId={activeSurveyId}
          onClose={() => setActiveSurveyId(null)}
          showReward={showReward}
        />
      )}

      <XpRewardToast data={rewardData} onDismiss={dismiss} />
    </div>
  );
}
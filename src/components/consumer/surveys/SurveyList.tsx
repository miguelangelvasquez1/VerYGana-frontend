'use client';

import React, { useState } from 'react';
import { useAvailableSurveys } from '@/hooks/surveys/useSurvey';
import SurveyCard from './SurveyCard';
import SurveyPlayerModal from './SurveyPlayerModal';
import RewardsBanner from './RewardsBanner';
import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

export default function SurveyList() {
  const [page, setPage] = useState(0);
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(null);

  const { data, isLoading, isError } = useAvailableSurveys(page, 8);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Rewards summary banner */}
      <RewardsBanner />

      {/* Section header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Encuestas disponibles
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Responde encuestas y gana recompensas. Las más relevantes para ti aparecen primero.
        </p>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          No pudimos cargar las encuestas. Intenta de nuevo más tarde.
        </div>
      )}

      {!isLoading && !isError && data?.content.length === 0 && (
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
      {!isLoading && data && data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.content.map((survey, index) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                rank={page * 8 + index + 1}
                onStart={() => setActiveSurveyId(survey.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">
                {page + 1} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
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
        />
      )}
    </div>
  );
}
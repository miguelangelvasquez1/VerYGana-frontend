'use client';

import React from 'react';
import { Clock, CheckCircle2, Award, ChevronRight } from 'lucide-react';
import { formatReward } from '@/hooks/surveys/surveyUtils';
import type { SurveySummary } from '@/types/survey.types';

interface Props {
  survey: SurveySummary;
  rank: number;
  onStart: () => void;
}

export default function SurveyCard({ survey, rank, onStart }: Props) {
  if (survey.alreadyCompleted) {
    return <CompletedCard survey={survey} />;
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Rank badge */}
      {rank <= 3 && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
            ★ Top {rank}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
          {survey.title}
        </h3>

        {/* Description */}
        {survey.description && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
            {survey.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-auto pt-4 flex items-center justify-between">

          <button
            onClick={onStart}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all"
          >
            Responder
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletedCard({ survey }: { survey: SurveySummary }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 opacity-70">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">
            Completada · {formatReward(survey.rewardAmount)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-600 leading-snug line-clamp-2">
          {survey.title}
        </h3>
        <p className="mt-auto pt-4 text-xs text-gray-400">
          Ya ganaste tu recompensa por esta encuesta.
        </p>
      </div>
    </div>
  );
}
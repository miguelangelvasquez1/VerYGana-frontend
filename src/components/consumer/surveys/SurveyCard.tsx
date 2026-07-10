'use client';

import React from 'react';
import { ChevronRight, HelpCircle, Coins } from 'lucide-react';
import { formatReward } from '@/hooks/surveys/surveyUtils';
import type { AvailableSurveyDTO } from '@/types/survey.types';

interface Props {
  survey: AvailableSurveyDTO;
  rank: number;
  onStart: () => void;
}

export default function SurveyCard({ survey, rank, onStart }: Props) {
  const totalReward = (survey.rewardAmountPerQuestionCents * survey.totalQuestions) / 100;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:border-[#03548C]/20 transition-all duration-200">

      {/* Top accent gradient */}
      <div className="h-1 w-full bg-linear-to-r from-[#0b1440] to-[#03548C]" />

      {/* Rank badge */}
      {rank <= 3 && (
        <div className="absolute right-3 top-4">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
            ★ Top {rank}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* Title + description */}
        <div className={rank <= 3 ? 'pr-16' : ''}>
          <h3 className="text-base font-bold leading-snug text-gray-900 line-clamp-2">
            {survey.title}
          </h3>
          {survey.description && (
            <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
              {survey.description}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-stretch gap-2">
          {/* Reward */}
          <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-[#03548C]/5 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#03548C] shadow-sm shadow-[#03548C]/30">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#03548C]/60">
                Recompensa
              </p>
              <p className="text-sm font-bold text-[#03548C] truncate">
                {formatReward(totalReward)}
              </p>
            </div>
          </div>

          {/* Questions */}
          <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-gray-50 px-4 py-2.5">
            <HelpCircle className="h-4 w-4 text-gray-400" />
            <p className="text-lg font-bold leading-none text-gray-700">
              {survey.totalQuestions}
            </p>
            <p className="text-[10px] text-gray-400">preguntas</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#03548C] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b1440] active:scale-95"
        >
          Ver encuesta
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}

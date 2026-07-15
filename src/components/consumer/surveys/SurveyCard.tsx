'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, HelpCircle, Users, Clock } from 'lucide-react';
import { formatKeys, getScarcitySpotsLabel, getUrgentDeadlineLabel } from '@/hooks/surveys/surveyUtils';
import type { AvailableSurveyDTO } from '@/types/survey.types';

interface Props {
  survey: AvailableSurveyDTO;
  rank: number;
  onStart: () => void;
}

export default function SurveyCard({ survey, rank, onStart }: Props) {
  const spotsLabel = getScarcitySpotsLabel(survey.maxResponses, survey.responseCount);
  const deadlineLabel = getUrgentDeadlineLabel(survey.endsAt);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#03548C]/20 hover:shadow-xl">

      {/* Reward hero strip */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#0b1440] via-[#03548C] to-[#0b1440] px-5 py-4">
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 left-8 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Recompensa
            </p>
            <p className="truncate text-2xl font-black text-white">
              {formatKeys(survey.totalRewardKeys)} llaves
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Image src="/logos/llave.png" alt="Llaves" width={26} height={26} className="object-contain" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* Title + description */}
        <div>
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-gray-900 line-clamp-2">
              {survey.title}
            </h3>
            {rank <= 3 && (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                ★ Top {rank}
              </span>
            )}
          </div>
          {survey.description && (
            <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
              {survey.description}
            </p>
          )}
        </div>

        {/* Urgency / scarcity badges */}
        {(spotsLabel || deadlineLabel) && (
          <div className="flex flex-wrap gap-2">
            {spotsLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                <Users className="h-3 w-3" />
                {spotsLabel}
              </span>
            )}
            {deadlineLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                <Clock className="h-3 w-3" />
                {deadlineLabel}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5 text-gray-500">
            <HelpCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{survey.totalQuestions}</span>
            <span className="text-xs text-gray-400">preguntas</span>
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#03548C] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0b1440] active:scale-95"
          >
            Ver encuesta
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

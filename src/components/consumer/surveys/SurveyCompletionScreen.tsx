'use client';

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { formatReward, formatDateTime } from '@/hooks/surveys/surveyUtils';
import type { SubmissionResult } from '@/types/survey.types';

interface Props {
  result: SubmissionResult;
  onClose: () => void;
}

export default function SurveyCompletionScreen({ result, onClose }: Props) {
  const { reward } = result;

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
      {/* Celebration icon */}
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 shadow-xl shadow-amber-100">
        <Image src="/logos/llave.png" alt="Recompensa" width={64} height={64} />

        {/* Orbiting stars */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <Star
            key={deg}
            className="absolute h-3 w-3 fill-amber-300 text-amber-300 animate-spin"
            style={{
              transform: `rotate(${deg}deg) translateX(48px)`,
              animationDuration: '8s',
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          ¡Recompensa ganada!
        </h2>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">{result.message}</p>
      </div>

      {/* Reward card */}
      <div className="w-full rounded-2xl bg-linear-to-br from-[#0b1440] to-[#03548C] p-5 text-white shadow-lg shadow-[#03548C]/20">
        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
          Tu recompensa
        </p>
        <p className="text-3xl font-black">
          {formatReward(reward.amountCents / 1000)}
        </p>
        <p className="mt-2 text-xs text-white/60">
          {reward.status === 'PROCESSED'
            ? 'Acreditada exitosamente'
            : 'Pendiente de procesamiento'}
          {reward.grantedAt && ` · ${formatDateTime(reward.grantedAt)}`}
        </p>
      </div>

      {/* Status indicator */}
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
          reward.status === 'PROCESSED'
            ? 'bg-emerald-50 text-emerald-700'
            : reward.status === 'FAILED'
              ? 'bg-red-50 text-red-600'
              : 'bg-amber-50 text-amber-600'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            reward.status === 'PROCESSED'
              ? 'bg-emerald-500'
              : reward.status === 'FAILED'
                ? 'bg-red-500'
                : 'bg-amber-500 animate-pulse'
          }`}
        />
        {reward.status === 'PROCESSED'
          ? 'Recompensa acreditada'
          : reward.status === 'FAILED'
            ? 'Error al procesar — contáctanos'
            : 'Procesando recompensa…'}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="mt-2 rounded-xl bg-[#0b1440] px-8 py-3 text-sm font-semibold text-white hover:bg-[#03548C] active:scale-95 transition-all cursor-pointer"
      >
        Continuar
      </button>
    </div>
  );
}
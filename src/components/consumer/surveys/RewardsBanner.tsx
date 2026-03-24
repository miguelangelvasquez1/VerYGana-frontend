'use client';

import React from 'react';
import { Award, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { useRewardsSummary } from '@/hooks/surveys/useSurvey';
import { formatReward, formatDateTime } from '@/hooks/surveys/surveyUtils';

export default function RewardsBanner() {
  const { data, isLoading } = useRewardsSummary();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 p-5 text-white">
        <Loader2 className="h-5 w-5 animate-spin opacity-70" />
        <span className="text-sm opacity-70">Cargando recompensas…</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 p-5 text-white shadow-lg shadow-indigo-100">
      <div className="flex items-center justify-between">
        {/* Left: title */}
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-200" />
            <h3 className="text-sm font-semibold text-indigo-100">
              Mis recompensas
            </h3>
          </div>
          <p className="mt-2 text-3xl font-black">
            {formatReward(data.totalRewardsEarned)}
          </p>
          <p className="mt-0.5 text-xs text-indigo-200">total ganado</p>
        </div>

        {/* Right: stats */}
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-200" />
            <span className="text-sm font-bold">{data.completedSurveys}</span>
          </div>
          <p className="text-xs text-indigo-200">
            {data.completedSurveys === 1
              ? 'encuesta completada'
              : 'encuestas completadas'}
          </p>
        </div>
      </div>

      {/* Recent rewards */}
      {data.recentRewards.length > 0 && (
        <div className="mt-4 border-t border-white/20 pt-4">
          <p className="mb-2 text-xs font-medium text-indigo-200">
            Últimas recompensas
          </p>
          <div className="space-y-1.5">
            {data.recentRewards.slice(0, 3).map((r) => (
              <div
                key={r.rewardId}
                className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"
              >
                <span className="text-xs text-indigo-100">
                  {formatDateTime(r.grantedAt)}
                </span>
                <span className="text-xs font-bold">
                  {formatReward(r.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
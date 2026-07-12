'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import ReferralPageShell from '@/components/referrals/ReferralPageShell';
import { getReferralInfo, type ReferralInfoDTO } from '@/services/ReferralService';
import { useXpReward } from '@/hooks/useXpReward';
import { XpRewardToast } from '@/components/levels/XpRewardToast';
import { levelService } from '@/services/LevelService';
import { levelKeys } from '@/hooks/useLevelProfile';

const SEEN_KEY = 'xp_seen_referral_txids';

function getSeenIds(): Set<number> {
  try {
    return new Set<number>(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]'));
  } catch { return new Set(); }
}

function markSeen(id: number) {
  const seen = getSeenIds();
  seen.add(id);
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export default function ReferralsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [info, setInfo]   = useState<ReferralInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { rewardData, showReward, dismiss } = useXpReward();

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReferralInfo();
      setInfo(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  // Mostrar XP animation por referidos nuevos no vistos en esta sesión
  useEffect(() => {
    const token = (session as any)?.accessToken as string | undefined;
    if (!token) return;

    Promise.all([
      levelService.getProfile(token),
      levelService.getHistory(token, 0, 10),
    ])
      .then(([profile, history]) => {
        queryClient.setQueryData(levelKeys.profile(), profile);
        const seen = getSeenIds();
        const newTx = history.content.find(
          tx => tx.activityType === 'REFERRAL_ACTIVE' && !seen.has(tx.id)
        );
        if (!newTx) return;

        markSeen(newTx.id);
        showReward({
          activityType: 'REFERRAL_ACTIVE',
          xpEarned: newTx.xpEarned,
          multiplier: newTx.multiplierApplied,
          currentLevel: profile.currentLevel,
          xpTotal: profile.xpTotal,
          xpToNextLevel: profile.xpToNextLevel,
        });
      })
      .catch(() => {});
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Users className="w-3.5 h-3.5 text-[#FFD700]" />
            Invita amigos y gana recompensas
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            Sistema de Referidos
          </h1>

          {info ? (
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
              Hola, <span className="text-white font-semibold">{info.consumerName}</span> — cada amigo que invites te da llaves y créditos
            </p>
          ) : (
            <p className="text-white/70 text-sm sm:text-base">
              Comparte tu código y gana llaves por cada amigo que se una
            </p>
          )}
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#03548C]" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-gray-700 font-medium">No se pudo cargar tu información</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={fetchInfo}
            className="px-6 py-2.5 bg-[#03548C] hover:bg-[#0b1440] text-white font-semibold rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && info && (
        <ReferralPageShell info={info} />
      )}

      <XpRewardToast data={rewardData} onDismiss={dismiss} />
    </div>
  );
}

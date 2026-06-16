'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import ReferralPageShell from '@/components/referrals/ReferralPageShell';
import { getReferralInfo, type ReferralInfoDTO } from '@/services/ReferralService';
import { useXpReward } from '@/hooks/useXpReward';
import { XpRewardToast } from '@/components/levels/XpRewardToast';
import { levelService } from '@/services/LevelService';

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

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
            Sistema de Referidos
          </h1>
          {info && (
            <p className="text-lg text-blue-100">
              Hola, {info.consumerName} — invita amigos y gana créditos
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-red-600">No se pudo cargar tu información: {error}</p>
          <button
            onClick={fetchInfo}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

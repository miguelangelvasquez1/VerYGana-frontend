'use client';

import Sidebar from "@/components/consumer/ads/Sidebar";
import VideoAdPlayer from "@/components/consumer/ads/VideoAdPlayer";
import { useXpReward } from '@/hooks/useXpReward';
import { XpRewardToast } from '@/components/levels/XpRewardToast';

export default function AdPage() {
  const { rewardData, showReward, dismiss } = useXpReward();

  return (
    <div className="relative flex flex-col h-full lg:h-[calc(100dvh-76px)] overflow-hidden bg-[#f4f7fb] text-[#0b1440]">

      {/* En el celular el contenido va fuera de flujo (absolute): así el alto del medio no empuja al <main> del
          layout más allá de la pantalla; la página mide lo que le deja el layout, ni más ni menos. */}
      <div className="flex flex-1 overflow-hidden max-lg:absolute max-lg:inset-0">
        {/* Sidebar (oculta en móvil) */}
        <aside className="hidden md:block w-90 bg-white border-r border-gray-100">
          <Sidebar />
        </aside>

        {/* Contenido principal */}
        {/* El espacio de la barra inferior del celular lo reserva el layout, una sola vez */}
        <main className="flex flex-1 justify-center items-center">
          <VideoAdPlayer onXpReward={showReward} />
        </main>
      </div>

      <XpRewardToast data={rewardData} onDismiss={dismiss} />
    </div>
  );
}

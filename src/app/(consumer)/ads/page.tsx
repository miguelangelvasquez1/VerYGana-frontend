'use client';

import Sidebar from "@/components/consumer/ads/Sidebar";
import VideoAdPlayer from "@/components/consumer/ads/VideoAdPlayer";

export default function AdPage() {
  return (
    <div className="flex flex-col h-[calc(100dvh-69px)] lg:h-[calc(100dvh-76px)] overflow-hidden bg-black text-white">

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (oculta en móvil) */}
        <aside className="hidden md:block w-90 bg-black">
          <Sidebar />
        </aside>

        {/* Contenido principal */}
        <main className="flex flex-1 justify-center items-center pb-16 md:pb-0">
          <VideoAdPlayer />
        </main>
      </div>
    </div>
  );
}

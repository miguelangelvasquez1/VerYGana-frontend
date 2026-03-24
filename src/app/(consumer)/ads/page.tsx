'use client';

import Sidebar from "@/components/consumer/ads/Sidebar";
import VideoAdPlayer from "@/components/consumer/ads/VideoAdPlayer";
import Navbar from "@/components/bars/NavBar";

export default function AdPage() {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Navbar arriba */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (oculta en móvil) */}
        <aside className="hidden md:block w-90 bg-black">
          <Sidebar />
        </aside>

        {/* Contenido principal */}
        <main className="flex flex-1 justify-center items-center mb-16 md:mb-0">
          <VideoAdPlayer />
        </main>
      </div>
    </div>
  );
}

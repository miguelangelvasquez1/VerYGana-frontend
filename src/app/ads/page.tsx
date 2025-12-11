'use client';

import Sidebar from "@/components/Ads/Sidebar";
import VideoAdPlayer from "@/components/Ads/VideoAdPlayer";
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
        <main className="flex flex-1 justify-center items-center">
          <VideoAdPlayer />
        </main>
      </div>
    </div>
  );
}

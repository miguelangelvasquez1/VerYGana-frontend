"use client";

import { Headset } from "lucide-react";
import PqrsPanel from "@/components/pqrs/PqrsPanel";

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 lg:pb-0">
      {/* HERO */}
      <header className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Headset className="w-3.5 h-3.5" />
            Soporte y PQRS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Soporte</h1>
          <p className="text-white/70 text-sm max-w-md">
            Radica peticiones, quejas, reclamos o sugerencias y haz seguimiento a su estado.
          </p>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PqrsPanel />
      </main>
    </div>
  );
};

export default SupportPage;

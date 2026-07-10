import React from 'react';
import SurveyList from '@/components/consumer/surveys/SurveyList';

export const metadata = {
  title: 'Encuestas disponibles',
  description: 'Responde encuestas y gana recompensas',
};

export default function SurveysPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb]">

      {/* HERO */}
      <header className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              📋 Gana respondiendo
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Encuestas disponibles
            </h1>
            <p className="text-white/70 text-sm max-w-md">
              Responde encuestas y gana recompensas. Las más relevantes para ti aparecen primero.
            </p>
          </div>

          {/* Wave bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
            </svg>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <SurveyList />
      </main>

    </div>
  );
}
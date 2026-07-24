'use client';

import React, { useState, useEffect } from 'react';
import SurveyList from '@/components/consumer/surveys/SurveyList';

export default function SurveysPage() {
  const [animateHero, setAnimateHero] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimateHero(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-full flex flex-col bg-[#f4f7fb]">

      {/* HERO */}
      <header className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />

          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center transition-all duration-700 ${animateHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              📋 Gana respondiendo
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Encuestas disponibles
            </h1>
            <p className="text-white/70 text-base lg:text-lg mb-0 max-w-lg mx-auto">
              Responde encuestas y gana recompensas. Las más relevantes para ti aparecen primero.
            </p>
          </div>

          {/* Wave bottom */}
          <div className="absolute -bottom-px left-0 right-0 leading-0">
            <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { ANALYTICS_SECTIONS, SectionId, hasPlanAccess } from '../sections.config';

interface HighlightData {
  value: string;
  subtitle: string;
}

// Valores de ejemplo: se reemplazan cuando cada sección conecte su endpoint real.
const PLACEHOLDER_DATA: Record<Exclude<SectionId, 'overview'>, HighlightData> = {
  sales:     { value: '—', subtitle: 'Ganancias del período' },
  ads:       { value: '—', subtitle: 'Impresiones y clicks' },
  surveys:   { value: '—', subtitle: 'Respuestas recibidas' },
  games:     { value: '—', subtitle: 'Partidas jugadas' },
  referrals: { value: '—', subtitle: 'Impresiones y clics de remisión' },
  premium:   { value: '—', subtitle: 'Visitas y consumos' },
};

interface OverviewSectionProps {
  effectivePlan: PlanCode | null;
  onNavigate: (section: SectionId) => void;
}

export function OverviewSection({ effectivePlan, onNavigate }: OverviewSectionProps) {
  const sections = ANALYTICS_SECTIONS.filter((s) => s.id !== 'overview');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {sections.map((section) => {
        const unlocked = hasPlanAccess(effectivePlan, section.allowedPlans);
        const data = PLACEHOLDER_DATA[section.id as Exclude<SectionId, 'overview'>];
        const Icon = section.icon;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            className={`text-left bg-white rounded-lg shadow-sm border border-gray-100 p-5 transition-colors hover:border-[#03548C]/40 cursor-pointer ${
              !unlocked ? 'opacity-80' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">{section.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 truncate">
                  {unlocked ? data.value : 'Bloqueado'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {unlocked ? data.subtitle : section.lockedMessage}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl shrink-0 ${unlocked ? 'bg-[#03548C]/10' : 'bg-gray-100'}`}>
                {unlocked ? (
                  <Icon className="w-5 h-5 text-[#03548C]" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

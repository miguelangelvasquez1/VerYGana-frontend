'use client';

// components/plans/PlanGuard.tsx
// Envuelve cualquier página o sección que requiera un plan específico.
// Si el plan no es suficiente, muestra un bloqueo con CTA para mejorar.

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { usePlanState } from '../layout/DashboardLayout';
import { PlanCode } from '@/types/finance/plans/Plan.types';

interface PlanGuardProps {
  requiredPlans: PlanCode[];
  children: React.ReactNode;
  featureName?: string;
}

const UPGRADE_INFO: Record<string, { label: string; color: string }> = {
  BASIC:    { label: 'Plan Básico, Estándar o Premium', color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400' },
  STANDARD: { label: 'Plan Estándar',                  color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400' },
  PREMIUM:  { label: 'Plan Premium',                   color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 text-purple-400' },
};

export function PlanGuard({ requiredPlans, children, featureName }: PlanGuardProps) {
  const { planState, loadingPlan } = usePlanState();

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccess =
    planState?.effectivePlan != null &&
    requiredPlans.includes(planState.effectivePlan);
  if (hasAccess) return <>{children}</>;

  // Determinar qué plan se necesita (el menor de los requeridos)
  const neededPlan: PlanCode = requiredPlans.includes(PlanCode.BASIC)
    ? PlanCode.BASIC
    : requiredPlans.includes(PlanCode.STANDARD)
    ? PlanCode.STANDARD
    : PlanCode.PREMIUM;
  const info = UPGRADE_INFO[neededPlan];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className={`max-w-md w-full rounded-2xl border bg-linear-to-br px-8 py-10 text-center ${info.color}`}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-white/20">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {featureName ? `${featureName} no disponible` : 'Funcionalidad bloqueada'}
        </h3>
        <p className="text-slate-700 text-sm mb-6 leading-relaxed">
          Esta funcionalidad requiere el{' '}
          <span className="font-semibold">{info.label}</span>.
          Activa tu plan y desbloquea anuncios, juegos, encuestas y más.
        </p>

        <Link
          href="/plans"
          className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
        >
          Ver planes disponibles
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
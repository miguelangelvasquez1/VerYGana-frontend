'use client';

// components/plans/PlanGuard.tsx
// Envuelve cualquier página o sección que requiera un plan específico.
// Si el plan no es suficiente, muestra un bloqueo con CTA para mejorar.

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Zap, Rocket } from 'lucide-react';
import { usePlanState } from '../layout/DashboardLayout';
import { PlanCode } from '@/types/finance/plans/Plan.types';

interface PlanGuardProps {
  requiredPlans: PlanCode[];
  children: React.ReactNode;
  featureName?: string;
}

const UPGRADE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  BASIC: {
    icon: <Zap className="w-8 h-8" />,
    label: 'Plan Básico, Estándar o Premium',
    color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400',
  },
    STANDARD: {
    icon: <Zap className="w-8 h-8" />,
    label: 'Plan Estándar',
    color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400',
  },
  PREMIUM: {
    icon: <Rocket className="w-8 h-8" />,
    label: 'Plan Premium',
    color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 text-purple-400',
  },
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className={`
        max-w-5xl w-full rounded-3xl border-2 bg-linear-to-br px-20 py-16 text-center
        ${info.color}
      `}>
        <div className={`w-44 h-44 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white/10 ${info.color.split(' ').find(c => c.startsWith('text-'))}`}>
          <span className="scale-[2.5]">{info.icon}</span>
        </div>

        <Lock className="w-12 h-12 text-slate-900 mx-auto mb-6" />

        <h3 className="text-6xl font-extrabold from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400 mb-6 drop-shadow">
          {featureName ? `${featureName} no disponible` : 'Funcionalidad bloqueada'}
        </h3>
        <p className="text-slate-900 text-2xl mb-10 leading-relaxed font-medium">
          Esta funcionalidad requiere el{' '}
          <span className="font-extrabold text-slate-900">{info.label}</span>.
          Activa tu plan con una inversión y desbloquea anuncios, juegos, encuestas y más.
        </p>

        <Link
          href="/plans"
          className="inline-flex items-center gap-3 bg-white text-slate-900 font-extrabold text-xl px-12 py-5 rounded-2xl hover:bg-slate-100 transition-colors shadow-lg"
        >
          Ver planes disponibles
          <ArrowRight className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
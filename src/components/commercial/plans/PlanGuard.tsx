'use client';

// components/plans/PlanGuard.tsx
// Envuelve cualquier página o sección que requiera un plan específico.
// Si el plan no es suficiente, muestra un bloqueo con CTA para mejorar.

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Zap, Rocket } from 'lucide-react';
import { usePlanState } from '../layout/DashboardLayout';
import { Plan } from '@/types/plan';

interface PlanGuardProps {
  requiredPlans: Plan['code'][];
  children: React.ReactNode;
  featureName?: string;
}

const UPGRADE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    NO_PLAN: {
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

  const hasAccess = planState && requiredPlans.includes(planState.effectivePlan);
  if (hasAccess) return <>{children}</>;

  // Determinar qué plan se necesita (el menor de los requeridos)
  const neededPlan = requiredPlans.includes('BASIC') ? 'NO_PLAN' : 
    requiredPlans.includes('BASIC') ? 'BASIC' : 
    requiredPlans.includes('STANDARD') ? 'STANDARD' : 'PREMIUM';
  const info = UPGRADE_INFO[neededPlan];

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] px-4">
      <div className={`
        max-w-md w-full rounded-2xl border bg-gradient-to-br p-8 text-center
        ${info.color}
      `}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white/5 ${info.color.split(' ').find(c => c.startsWith('text-'))}`}>
          {info.icon}
        </div>

        <Lock className="w-5 h-5 text-slate-400 mx-auto mb-3" />

        <h3 className="text-xl font-bold text-white mb-2">
          {featureName ? `${featureName} no disponible` : 'Funcionalidad bloqueada'}
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Esta funcionalidad requiere el{' '}
          <span className="font-semibold text-white">{info.label}</span>.
          Activa tu plan con una inversión y desbloquea anuncios, juegos, encuestas y más.
        </p>

        <Link
          href="/commercial/plans"
          className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Ver planes disponibles
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
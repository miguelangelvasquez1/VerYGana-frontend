'use client';

// components/plans/LimitReached.tsx
// Bloqueo/aviso reutilizable cuando el comercial alcanza el máximo de un
// recurso (anuncios, productos, encuestas) permitido por su plan actual.

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, AlertTriangle } from 'lucide-react';

/** -1 = ilimitado, según el contrato del backend (EffectivePlanStateResponseDTO). */
export function isLimitReached(current: number, max: number | null | undefined): boolean {
  if (max == null || max === -1) return false;
  return current >= max;
}

interface LimitReachedBannerProps {
  resourceLabel: string;
  max: number;
}

/** Aviso en línea, para mostrar junto al listado/botón de creación. */
export function LimitReachedBanner({ resourceLabel, max }: LimitReachedBannerProps) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">Límite de {resourceLabel} alcanzado</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Tu plan actual permite un máximo de {max} {resourceLabel}. Mejora tu plan para crear más.
        </p>
      </div>
      <Link
        href="/plans"
        className="shrink-0 self-center text-xs font-semibold text-amber-800 underline hover:text-amber-900 whitespace-nowrap"
      >
        Ver planes
      </Link>
    </div>
  );
}

interface LimitReachedBlockProps {
  resourceLabel: string;
  max: number;
  backHref?: string;
  backLabel?: string;
}

/** Bloqueo de página completa, para rutas de creación abiertas directamente. */
export function LimitReachedBlock({ resourceLabel, max, backHref, backLabel }: LimitReachedBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
      <div className="max-w-md w-full rounded-2xl border border-amber-300 bg-linear-to-br from-amber-50 to-amber-100/40 px-8 py-10 text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-amber-500/15">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Límite de {resourceLabel} alcanzado
        </h3>
        <p className="text-slate-700 text-sm mb-6 leading-relaxed">
          Tu plan actual permite un máximo de <span className="font-semibold">{max}</span> {resourceLabel}.
          Mejora tu plan para poder crear más.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 bg-[#03548C] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#0b1440] transition-colors shadow-sm"
          >
            Ver planes disponibles
            <ArrowRight className="w-4 h-4" />
          </Link>
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-slate-600 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {backLabel ?? 'Volver'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

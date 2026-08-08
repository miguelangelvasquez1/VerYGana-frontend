'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

interface PlanLockedSectionProps {
  title: string;
  message: string;
  className?: string;
}

// Bloqueo inline para una sección del panel (a diferencia de PlanGuard, no
// ocupa toda la pantalla: se usa dentro de una pestaña/tarjeta ya existente).
export function PlanLockedSection({ title, message, className = '' }: PlanLockedSectionProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center ${className}`}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
        <Lock className="h-5 w-5 text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">{message}</p>
      <Link
        href="/plans"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#03548C] hover:underline"
      >
        Ver planes disponibles
      </Link>
    </div>
  );
}

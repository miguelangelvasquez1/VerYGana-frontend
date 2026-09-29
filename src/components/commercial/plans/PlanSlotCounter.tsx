'use client';

// components/commercial/plans/PlanSlotCounter.tsx
// Chip "8 / 10 anuncios" para poner junto al botón "Crear" de cada listado.
// Se pinta en rojo cuando el cupo está lleno. No renderiza nada mientras no se
// conozca el `used` (dashboard sin cargar y sin conteo local).

import React from 'react';
import type { PlanSlotStatus } from './planSlots';

interface PlanSlotCounterProps {
  status: PlanSlotStatus;
  /** Etiqueta en plural: "anuncios", "encuestas", "productos", "juegos". */
  resourceLabel: string;
  className?: string;
}

export function PlanSlotCounter({ status, resourceLabel, className = '' }: PlanSlotCounterProps) {
  if (status.used == null || !status.capable) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        status.full ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
      } ${className}`}
      title={
        status.unlimited
          ? `${status.used} ${resourceLabel} (sin límite en tu plan)`
          : `${status.counterLabel} ${resourceLabel} de tu plan`
      }
    >
      {status.counterLabel} {resourceLabel}
    </span>
  );
}

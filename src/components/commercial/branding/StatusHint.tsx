'use client';

import React, { lazy, Suspense, type ReactNode } from 'react';

// "?" con el significado del estado, en el encabezado de una solicitud de branding o de una campaña. Se abre con
// el puntero, el teclado o un toque (HelpHint). La ayuda se carga aparte: no entra en el JavaScript inicial de la
// página (RN-8 de la spec 014); mientras llega se ve el mismo círculo, sin acción.
const HelpHint = lazy(() => import('@/components/shared/HelpHint'));

interface StatusHintProps {
  /** Estado en texto, para el nombre accesible del botón. */
  statusLabel: string;
  /** Clases de color del círculo (las del distintivo del estado). */
  badge: string;
  /** Contenido del globo. */
  children: ReactNode;
}

export function StatusHint({ statusLabel, badge, children }: StatusHintProps) {
  const circle = (
    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${badge}`}>?</span>
  );
  return (
    <Suspense fallback={circle}>
      <HelpHint
        label={`Qué significa el estado: ${statusLabel}`}
        placement="below-end"
        className="-m-3.5 size-11 lg:m-0 lg:size-auto"
        text={children}
      >
        {circle}
      </HelpHint>
    </Suspense>
  );
}

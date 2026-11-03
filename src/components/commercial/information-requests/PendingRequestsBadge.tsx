'use client';

import { usePendingInformationRequestsCount } from '@/hooks/commercial/useInformationRequests';
import { INFORMATION_REQUEST_TEXTS as T } from '@/lib/labels/expedienteRequests';

const VARIANT_CLASSES = {
  // Colores del menú lateral oscuro.
  sidebar: 'bg-orange-500 text-white',
  card: 'bg-orange-100 text-orange-700',
} as const;

// Número de solicitudes que esperan respuesta (CA-19). Con 0 o sin datos no pinta nada.
export function PendingRequestsBadge({ variant }: { variant: keyof typeof VARIANT_CLASSES }) {
  const { data: count } = usePendingInformationRequestsCount();
  if (!count) return null;

  return (
    <span
      className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${VARIANT_CLASSES[variant]}`}
    >
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">
        {count} {T.pendingSr}
      </span>
    </span>
  );
}

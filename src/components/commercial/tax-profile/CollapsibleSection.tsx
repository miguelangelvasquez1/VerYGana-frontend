'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

// El contenido sigue montado aunque esté plegado, para que sus campos sigan
// registrados en el formulario y el envío los valide.
export function CollapsibleSection({
  id,
  title,
  open,
  onToggle,
  hasError,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  hasError?: boolean;
  children: ReactNode;
}) {
  const panelId = `${id}-panel`;
  return (
    <section
      id={id}
      className={`rounded-2xl border bg-white ${hasError ? 'border-red-300' : 'border-gray-200'}`}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-gray-900 sm:px-5"
        >
          <span>
            {title}
            {hasError && (
              <span className="ml-2 text-xs font-semibold text-red-600">Revisa esta sección</span>
            )}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
        {children}
      </div>
    </section>
  );
}

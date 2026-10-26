'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Contenedor de los modales de Prosperidad del admin. Va en portal y por
// encima del modal de detalle del usuario (z-50).
export function ProsperityModalShell({
  title,
  subtitle,
  onClose,
  busy,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        <div className="border-t p-4">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-admin-blue focus:ring-admin-blue/20'
  }`;

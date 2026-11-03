'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { FOCUSABLE_SELECTOR, isTabbable, trappedFocusIndex } from '@/lib/a11y/focusTrap';

// Pila de diálogos abiertos: con diálogos anidados, Escape cierra solo el de arriba.
const openDialogs: string[] = [];

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
  // Con false, Escape, el fondo y la X no cierran (por ejemplo, mientras se sube un archivo).
  dismissible?: boolean;
}

export function Dialog({ open, title, onClose, children, size = 'md', dismissible = true }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const dialogId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Referencia estable para no reiniciar el efecto (y perder el foco) en cada render.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  }, [onClose, dismissible]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !mounted) return;
    const opener = document.activeElement as HTMLElement | null;
    openDialogs.push(dialogId);

    const onKey = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== dialogId) return;
      if (event.key === 'Tab') {
        // Foco atrapado: Tab y Mayús+Tab circulan dentro del panel.
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
        const target = trappedFocusIndex({
          index: focusables.indexOf(document.activeElement as HTMLElement),
          count: focusables.length,
          shiftKey: event.shiftKey,
        });
        if (target === null) return;
        event.preventDefault();
        (target === 'panel' ? panel : focusables[target]).focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (!dismissibleRef.current) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('keydown', onKey);
      const index = openDialogs.lastIndexOf(dialogId);
      if (index >= 0) openDialogs.splice(index, 1);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, mounted, dialogId]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/45"
        onClick={() => {
          if (dismissible) onCloseRef.current();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            disabled={!dismissible}
            aria-disabled={!dismissible}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

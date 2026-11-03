'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface HelpHintProps {
  /** Nombre accesible del botón, por ejemplo "Ayuda para: URL de destino". */
  label: string;
  /** Texto de la ayuda (o varios párrafos). */
  text: ReactNode;
  /** Contenido del botón (el ícono "?"). */
  children: ReactNode;
  /** Clases del botón: el área de 44 px en el celular con márgenes negativos que devuelven el espacio, y el color del ícono. */
  className?: string;
  /** Dónde sale el globo: sobre el botón y centrado (por defecto) o debajo, pegado al borde derecho (encabezados). */
  placement?: 'top' | 'below-end';
}

// Ayuda "?" que abre y cierra con un toque (spec 014, RN-2): el puntero la abre al pasar por encima y el teclado al
// enfocarla, como antes. En una pantalla táctil el navegador manda `mouseenter` y el foco justo antes del `click`;
// si los tres alternaran el estado, la ayuda se abriría y se cerraría en el mismo toque. Por eso el tipo de puntero
// del último toque decide: con el dedo solo cuenta el `click` (alterna) y se cierra al tocar fuera o con Escape.
// El botón debe medir 44 px en el celular: quien lo usa pasa el tamaño y los márgenes negativos que devuelven el
// espacio extra para no mover el diseño de escritorio (`size-11 -m-[15px] lg:m-0 lg:size-auto`).
export default function HelpHint({ label, text, children, className = '', placement = 'top' }: HelpHintProps) {
  const [open, setOpen] = useState(false);
  const touch = useRef(false);
  const root = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span ref={root} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onPointerDown={(e) => {
          touch.current = e.pointerType !== 'mouse';
        }}
        onMouseEnter={() => {
          if (!touch.current) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!touch.current) setOpen(false);
        }}
        onFocus={() => {
          if (!touch.current) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          touch.current = false;
          if (e.key === 'Escape') setOpen(false);
        }}
        onClick={() => {
          if (touch.current) setOpen((o) => !o);
        }}
        className={`flex shrink-0 cursor-pointer items-center justify-center ${className}`.trim()}
      >
        {children}
      </button>
      {open && (
        <div
          role="tooltip"
          className={
            placement === 'top'
              ? 'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-60 lg:w-64 lg:py-3 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-normal normal-case not-italic leading-relaxed text-white shadow-xl'
              : 'pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] space-y-1 rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-normal normal-case not-italic leading-relaxed text-white shadow-xl'
          }
        >
          {text}
          {placement === 'top' && (
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          )}
        </div>
      )}
    </span>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface UnderDevelopmentNoticeProps {
  /** Destino de "Volver al inicio": el inicio del rol, o `/` sin sesión. */
  homeHref: string;
}

// Aviso "En desarrollo" encima de una página bloqueada (spec 016, CA-4 y CA-5). No se puede cerrar: no hay ✕, y
// ni Escape ni un clic fuera hacen nada. La capa queda debajo de las barras (z-50), que siguen usables con mouse
// o toque. El teclado se queda dentro del aviso (D-8).
export default function UnderDevelopmentNotice({ homeHref }: UnderDevelopmentNoticeProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    link?.focus();

    // El botón es lo único enfocable del aviso: Tab y Shift+Tab devuelven el foco a él.
    const keepFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      linkRef.current?.focus();
    };
    document.addEventListener('keydown', keepFocus, true);

    // Sin desplazamiento mientras el aviso está montado; al navegar se restaura.
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', keepFocus, true);
      root.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      data-under-development
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="under-development-title"
        aria-describedby="under-development-text"
        className="w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
      >
        <h2 id="under-development-title" className="text-2xl font-extrabold text-[#03548C]">
          En desarrollo
        </h2>
        <p id="under-development-text" className="mt-3 text-gray-600">
          Muy pronto vas a poder recargar tu celular y contratar planes con tu saldo.
        </p>
        <Link
          ref={linkRef}
          href={homeHref}
          className="mt-6 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[#00a4ff] px-6 font-semibold text-white transition hover:bg-[#0090e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03548C] focus-visible:ring-offset-2"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import { usePetBridge } from '@/hooks/pet/usePetBridge';
import { usePetSession } from '@/hooks/pet/usePetSession';

const PetGame: React.FC = () => {
  // El build actual le pega directo a la API y no usa el bridge, pero lo
  // dejamos montado: es el camino previsto para que el JWT no salga de nuestro
  // origen, y se activa solo cuando llegue un build que hable postMessage.
  const { iframeRef } = usePetBridge();
  const { iframeUrl, loading, error, retry } = usePetSession();

  // Los tres estados comparten marco para que no haya salto de tamaño entre
  // "preparando" y el juego ya cargado. El fondo va en el mismo #231f20 del
  // build de Unity: el juego se enmarca solo a 16:9, así que las franjas
  // sobrantes se funden con el contenedor en vez de verse como borde blanco.
  const frame =
    'h-full w-full overflow-hidden bg-[#231f20] shadow-sm sm:rounded-2xl sm:border sm:border-gray-200';

  if (loading) {
    return (
      <div className={`${frame} flex items-center justify-center`}>
        <p className="text-sm text-white/70">Preparando tu mascota…</p>
      </div>
    );
  }

  if (error || !iframeUrl) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-4 px-6 text-center`}>
        <p className="text-sm text-white/70">{error}</p>
        <button
          onClick={retry}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${frame}`}>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className="block h-full w-full border-0"
        title="Mascota Virtual"
        allow="autoplay; fullscreen *"
        allowFullScreen
      />
      <RotateHint />
    </div>
  );
};

/**
 * Aviso de "gira tu teléfono".
 *
 * Va como capa encima del iframe, nunca en su lugar: el juego pesa ~75 MB, así
 * que desmontarlo al rotar significaría recargarlo entero cada vez. Debajo
 * sigue vivo y con tamaño real, y el build de Unity se reajusta solo en su
 * listener de `orientationchange`.
 *
 * Quién lo ve se decide 100% en CSS por la misma razón: con `matchMedia` en
 * estado de React, cada giro provocaría un render que puede tocar el iframe.
 *   · landscape       → oculto (el juego ya se ve bien)
 *   · puntero fino    → oculto (una ventana angosta de escritorio no se gira)
 */
function RotateHint() {
  return (
    // Sin `pointer-events-none`: mientras el aviso está arriba tiene que
    // bloquear los toques, o el usuario le estaría pegando a un juego que no
    // ve.
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#231f20] px-8 text-center landscape:hidden pointer-fine:hidden">
      <Smartphone
        className="pet-rotate-hint h-11 w-11 text-white/85"
        strokeWidth={1.25}
        aria-hidden
      />
      <div>
        <p className="text-base font-semibold text-white">Gira tu teléfono</p>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
          Tu mascota se ve en horizontal.
        </p>
      </div>
    </div>
  );
}

export default PetGame;

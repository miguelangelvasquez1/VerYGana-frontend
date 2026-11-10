'use client';

import { useState } from 'react';
import Sidebar from "@/components/consumer/ads/Sidebar";
import VideoAdPlayer from "@/components/consumer/ads/VideoAdPlayer";
import { useXpReward } from '@/hooks/useXpReward';
import { XpRewardToast } from '@/components/levels/XpRewardToast';

export default function AdPage() {
  const { rewardData, showReward, dismiss } = useXpReward();
  // Nodo real donde VideoAdPlayer pinta (vía portal) el canvas del "modo ambiente". Vive aquí,
  // como hijo directo de la fila, para que cubra el fondo completo detrás de la tarjeta y el
  // video por igual. Antes ese canvas vivía dentro de VideoAdPlayer y escapaba por `position:
  // absolute` hasta esta fila, pero bastaba que un ancestro intermedio (p.ej. <main>) tuviera
  // `position: relative` para cortar el escape a mitad de camino: el canvas quedaba atrapado
  // en la columna del video y la izquierda se veía como un bloque sólido aparte. useState (no
  // useRef) porque el callback ref dispara un re-render al montar, y VideoAdPlayer necesita ese
  // nodo ya listo para poder pintar el portal dentro de él.
  const [ambientHost, setAmbientHost] = useState<HTMLDivElement | null>(null);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      {/* El reproductor ocupa el espacio disponible bajo la navegación; esta pantalla inmersiva
          no incluye el pie general para no desplazar ni ocultar el anuncio en celulares. */}
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f7fb] text-[#0b1440] lg:h-[calc(100dvh-76px)]">

        {/* En el celular el contenido va fuera de flujo (absolute): así el alto del medio no empuja al <main> del
            layout más allá de la pantalla; la página mide lo que le deja el layout, ni más ni menos.
            Esta fila lleva el fondo oscuro base; el canvas del modo ambiente se pinta encima, en
            `ambientHost`, sin padding propio para que llegue hasta el borde real de la fila. */}
        <div className="relative isolate w-full h-full flex-1 overflow-hidden max-lg:absolute max-lg:inset-0 bg-gradient-to-br from-[#0b1440] via-[#071029] to-black">

          {/* Fondo ambiente: hijo directo y real de esta fila (ya no escapado desde dentro del
              video), así cubre el 100% del ancho por igual detrás de la tarjeta y del video.
              `z-[-1]` explícito (no basta con el orden en el DOM) para que quede, sin ambigüedad,
              por debajo de la tarjeta y del video sin importar cómo stackee cada uno. */}
          <div ref={setAmbientHost} className="absolute inset-0 z-[-1] overflow-hidden" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-[1800px] min-w-0 flex-1 items-center justify-center gap-4 px-0 sm:gap-6 md:px-6 xl:gap-8 2xl:gap-12">
            {/* Panel flotante (oculto en celular/tableta): ancho fijo y `shrink-0`, en fila con el video para
                que nunca se superpongan. El panel transparente deja que el fondo ambiente se
                vea a través suyo; la tarjeta de Sidebar, translúcida, flota
                encima de ese color. `flex items-center` la centra verticalmente en el lateral. */}
            <div className="relative hidden w-80 shrink-0 items-center bg-transparent lg:flex lg:py-8 2xl:w-96">
              <Sidebar />
            </div>

            {/* El video toma el espacio restante; el espacio de la barra inferior móvil lo reserva el layout. */}
            <main className="relative h-full min-w-0 flex-1 py-2 sm:py-4 lg:py-6 2xl:py-8">
              <VideoAdPlayer onXpReward={showReward} ambientContainer={ambientHost} />
            </main>
          </div>
        </div>

        <XpRewardToast data={rewardData} onDismiss={dismiss} />
      </div>
    </div>
  );
}

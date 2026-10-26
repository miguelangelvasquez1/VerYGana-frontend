import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PetGame from '@/components/PetGame';

export default function MascotaPage() {
  // Sin encabezado ni copy: el juego se presenta solo. En el celular (táctil, menos de 1024 px) la sección
  // pasa a pantalla completa, sin las barras de la app, y aparece "Salir". En horizontal va derecha (variante
  // `immersive`); en vertical gira 90° (variante `immersive-portrait`, `data-immersive="rotate"`), como
  // `/games/play`, para que la barra de Safari quede en el lado largo del teléfono. Todo es CSS: sin estado
  // de React por orientación, el árbol es el mismo y el iframe no se desmonta ni se recarga al girar (RN-2).
  // En los demás casos el juego llena el alto disponible bajo la navbar.
  return (
    <section
      data-immersive="rotate"
      className="h-full w-full p-0 sm:p-4 lg:p-6 immersive:fixed immersive:inset-0 immersive:z-30 immersive:p-0 immersive-portrait:fixed immersive-portrait:top-1/2 immersive-portrait:left-1/2 immersive-portrait:z-30 immersive-portrait:p-0 immersive-portrait:w-[100dvh] immersive-portrait:h-[100dvw] immersive-portrait:[transform:translate(-50%,-50%)_rotate(-90deg)]"
    >
      <PetGame />
      {/* En vertical la sección está girada: `top` y `left` son del juego, así que arriba usa el área segura
          izquierda de la pantalla y a la izquierda, la de abajo. */}
      <Link
        href="/home"
        className="hidden immersive:flex immersive-portrait:flex absolute z-10 top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] immersive-portrait:top-[max(0.75rem,env(safe-area-inset-left))] immersive-portrait:left-[max(0.75rem,env(safe-area-inset-bottom))] min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-black/50 px-4 text-sm font-medium text-white backdrop-blur-sm active:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Salir
      </Link>
    </section>
  );
}

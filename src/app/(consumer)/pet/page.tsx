import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PetGame from '@/components/PetGame';

export default function MascotaPage() {
  // Sin encabezado ni copy: el juego se presenta solo. En el celular en horizontal (variante `immersive`, que
  // solo usa CSS) la sección pasa a pantalla completa, sin las barras de la app, y aparece "Salir"; así el
  // iframe no se desmonta al girar. En los demás casos el juego llena el alto disponible bajo la navbar.
  return (
    <section
      data-immersive
      className="h-full w-full p-0 sm:p-4 lg:p-6 immersive:fixed immersive:inset-0 immersive:z-30 immersive:p-0"
    >
      <PetGame />
      <Link
        href="/home"
        className="hidden immersive:flex absolute z-10 top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-black/50 px-4 text-sm font-medium text-white backdrop-blur-sm active:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Salir
      </Link>
    </section>
  );
}

import PetGame from '@/components/PetGame';

export default function MascotaPage() {
  // Sin encabezado ni copy: el juego se presenta solo, y todo el alto
  // disponible bajo la navbar es suyo.
  return (
    <section className="h-full w-full p-0 sm:p-4 lg:p-6">
      <PetGame />
    </section>
  );
}

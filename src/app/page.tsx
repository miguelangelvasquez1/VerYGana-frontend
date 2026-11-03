import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import { getRoleHomePath } from '@/lib/auth/roleRedirect';
import GuestNavBar from '@/components/bars/GuestNavBar';
import Footer from '@/components/Footer';
import HomePage from '@/components/consumer/home/HomePage';

// `/` sin sesión es el home del consumidor con accesos de visitante (spec 014, sección A): la barra sin sesión (solo logo y botones de entrada), el
// mismo `HomePage` (cada acceso lleva a `/login?from=<ruta>`) y el pie de visitante. Con sesión, redirige al inicio del
// rol desde el servidor, antes de pintar nada.
export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const home = getRoleHomePath(session?.user?.role);
  if (home) redirect(home);

  return (
    <div className="flex flex-col h-dvh">
      <GuestNavBar />

      {/* Mismo fondo que el `main` de `(consumer)/layout.tsx`. Sin barra inferior, no reserva su alto. */}
      <main className="flex-1 bg-gray-100">
        <HomePage guest />
      </main>

      <Footer guest />
    </div>
  );
}

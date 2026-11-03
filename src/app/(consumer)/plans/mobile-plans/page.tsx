import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getUnderDevelopmentExitHref } from '@/lib/auth/roleRedirect';
import MobilePlansCatalog from '@/components/plans/MobilePlansCatalog';
import UnderDevelopmentNotice from '@/components/shared/UnderDevelopmentNotice';

// Recargas está en desarrollo (spec 016, CA-4): el catálogo se pinta detrás, desenfocado e inerte (sin foco,
// clics ni árbol de accesibilidad), y encima va el aviso. Solo se lee el rol de la sesión, para el destino del botón.
export default async function MobilePlansPage() {
  const session = await getServerSession(authOptions);
  const homeHref = getUnderDevelopmentExitHref(session?.user?.role);

  return (
    <>
      <div inert aria-hidden="true" data-blocked-content className="pointer-events-none select-none blur-sm max-h-dvh overflow-hidden">
        <MobilePlansCatalog />
      </div>
      <UnderDevelopmentNotice homeHref={homeHref} />
    </>
  );
}

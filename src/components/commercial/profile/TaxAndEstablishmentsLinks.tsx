import Link from "next/link";
import { PendingRequestsBadge } from "@/components/commercial/information-requests/PendingRequestsBadge";
import { INFORMATION_REQUESTS_PATH } from "@/lib/notifications/informationRequestNotifications";

const linkClass =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#03548C] hover:bg-gray-50";

// Accesos de "Mi perfil" a la ficha tributaria, las sedes, el expediente y las solicitudes.
export default function TaxAndEstablishmentsLinks() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-gray-700">Información tributaria, expediente y solicitudes</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Consulta tu ficha tributaria, tus establecimientos y tus documentos, y responde las solicitudes de VERYGANA.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <Link href="/commercial/profile/tax-info" className={linkClass}>
          Información tributaria
        </Link>
        <Link href="/commercial/profile/establishments" className={linkClass}>
          Establecimientos
        </Link>
        <Link href="/commercial/profile/documents" className={linkClass}>
          Mi expediente
        </Link>
        <Link href={INFORMATION_REQUESTS_PATH} className={linkClass}>
          Solicitudes de información
          <PendingRequestsBadge variant="card" />
        </Link>
      </div>
    </div>
  );
}

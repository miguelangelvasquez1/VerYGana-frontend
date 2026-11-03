'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEstablishments } from '@/hooks/commercial/useTaxProfile';
import { readApiError } from '@/lib/api/apiError';
import { ESTABLISHMENT_RELATION_LABELS } from '@/lib/labels/taxCompliance';
import { splitEstablishments } from '@/lib/taxProfile/establishmentSchema';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { Establishment } from '@/types/commercial/TaxProfile.types';
import { CloseEstablishmentDialog } from './CloseEstablishmentDialog';
import { EstablishmentFormDialog } from './EstablishmentFormDialog';

function EstablishmentCard({
  establishment,
  onClose,
}: {
  establishment: Establishment;
  onClose?: (establishment: Establishment) => void;
}) {
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-semibold text-gray-900">{establishment.name}</p>
          <p className="break-words text-sm text-gray-600">{establishment.address}</p>
          <p className="text-sm text-gray-600">
            {establishment.municipalityName} · {ESTABLISHMENT_RELATION_LABELS[establishment.relation]}
          </p>
          {establishment.status === 'CLOSED' && (
            <p className="mt-1 break-words text-xs text-gray-500">
              Cerrada el {formatBogotaDateTime(establishment.closedAt)}
              {establishment.closedReason ? ` · ${establishment.closedReason}` : ''}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={() => onClose(establishment)}
            className="shrink-0 self-start rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Cerrar sede
          </button>
        )}
      </div>
    </li>
  );
}

// Lista de sedes con "Agregar sede" y "Cerrar sede". Se usa en la página de establecimientos
// y dentro de la sección f) de la ficha. Sin editar ni eliminar.
export function EstablishmentsManager() {
  const establishments = useEstablishments();
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState<Establishment | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  if (establishments.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando sedes">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (establishments.isError) {
    const forbidden = readApiError(establishments.error).status === 403;
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
        <p className="text-sm text-red-700">
          {forbidden ? 'No tienes permiso para ver esta información' : 'No pudimos cargar tus sedes'}
        </p>
        {!forbidden && (
          <button
            type="button"
            onClick={() => establishments.refetch()}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const { active, closed } = splitEstablishments(establishments.data);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        <p>Registra solo sedes físicas. Una página web, red social o correo no es un establecimiento</p>
        <p>¿Hay un dato errado? Cierra esta sede y registra la correcta</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#023e69]"
        >
          Agregar sede
        </button>
      </div>

      <section aria-labelledby="est-active-title" className="flex flex-col gap-3">
        <h3 id="est-active-title" className="text-sm font-bold text-gray-900">
          Activos
        </h3>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Aún no tienes sedes registradas
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((establishment) => (
              <EstablishmentCard key={establishment.id} establishment={establishment} onClose={setClosing} />
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3>
            <button
              type="button"
              onClick={() => setShowClosed((v) => !v)}
              aria-expanded={showClosed}
              aria-controls="est-closed-list"
              className="flex items-center gap-2 text-sm font-bold text-gray-900"
            >
              Cerrados ({closed.length})
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showClosed ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </h3>
          <ul id="est-closed-list" hidden={!showClosed} className="flex flex-col gap-3">
            {closed.map((establishment) => (
              <EstablishmentCard key={establishment.id} establishment={establishment} />
            ))}
          </ul>
        </section>
      )}

      <EstablishmentFormDialog open={adding} onClose={() => setAdding(false)} />
      <CloseEstablishmentDialog establishment={closing} onClose={() => setClosing(null)} />
    </div>
  );
}

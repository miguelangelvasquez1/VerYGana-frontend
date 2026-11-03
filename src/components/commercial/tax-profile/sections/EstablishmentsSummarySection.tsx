'use client';

import { useState } from 'react';
import { EstablishmentsManager } from '@/components/commercial/establishments/EstablishmentsManager';
import { Dialog } from '@/components/shared/Dialog';
import { useEstablishments } from '@/hooks/commercial/useTaxProfile';
import { splitEstablishments } from '@/lib/taxProfile/establishmentSchema';

// Sección f): no va en el envío; solo cuenta las sedes activas y abre su gestión.
export function EstablishmentsSummarySection() {
  const establishments = useEstablishments();
  const [open, setOpen] = useState(false);
  const activeCount = splitEstablishments(establishments.data ?? []).active.length;

  return (
    <>
      <p className="text-sm text-gray-700">
        {activeCount === 1
          ? 'Tienes 1 establecimiento activo'
          : `Tienes ${activeCount} establecimientos activos`}
      </p>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[#03548C] px-4 py-2 text-sm font-semibold text-[#03548C] hover:bg-blue-50"
        >
          Gestionar sedes
        </button>
      </div>
      <Dialog open={open} title="Sedes" onClose={() => setOpen(false)} size="lg">
        <EstablishmentsManager />
      </Dialog>
    </>
  );
}

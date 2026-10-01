'use client';

import React from 'react';
import { AdminProsperityTab } from './AdminProsperityTab';

// Pestaña "Prosperidad" desde el detalle de usuario del admin. El Saldo se
// consulta por el publicId del empresario, el mismo que trae CommercialResponseDTO.
export function CommercialProsperityPanel({ publicId }: { publicId: string | null }) {
  if (!publicId) {
    return <p className="py-6 text-center text-sm text-gray-500">No se pudo identificar al empresario.</p>;
  }
  return <AdminProsperityTab publicId={publicId} />;
}

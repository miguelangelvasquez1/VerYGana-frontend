'use client';

import { useState } from 'react';

import { InformationRequestDetail } from './InformationRequestDetail';
import { InformationRequestsList } from './InformationRequestsList';

// Contenido del diálogo de solicitudes del onboarding: lista y detalle con estado local, sin cambiar de ruta.
// Sin cargar documentos: eso se hace después del registro (RN-9).
export function OnboardingRequestsBrowser() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <InformationRequestDetail
        requestPublicId={selectedId}
        canUploadDocuments={false}
        back={{ onBack: () => setSelectedId(null) }}
      />
    );
  }

  return <InformationRequestsList mode="onboarding" onSelect={setSelectedId} />;
}

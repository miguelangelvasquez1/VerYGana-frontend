import React from "react";
import type { TaxProfileResponse } from "@/types/commercial/TaxProfile.types";
import { TaxProfileFormContainer } from "@/components/commercial/tax-profile/TaxProfileFormContainer";

interface Props {
  onSaved: (response: TaxProfileResponse) => void | Promise<void>;
}

// Paso "Ficha tributaria": el contenedor carga ficha, catálogo, sedes y documentos
// y el formulario guarda; el asistente decide el siguiente paso al terminar.
export function TaxProfileStep({ onSaved }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Ficha tributaria</h3>
      </div>
      <TaxProfileFormContainer mode="onboarding" onSaved={onSaved} />
    </div>
  );
}

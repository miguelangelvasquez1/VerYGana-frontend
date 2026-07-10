"use client";

import PqrsPanel from "@/components/pqrs/PqrsPanel";

export default function CommercialSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Soporte</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Radica peticiones, quejas, reclamos o sugerencias sobre tu cuenta comercial y haz seguimiento a su estado.
        </p>
      </div>
      <PqrsPanel />
    </div>
  );
}

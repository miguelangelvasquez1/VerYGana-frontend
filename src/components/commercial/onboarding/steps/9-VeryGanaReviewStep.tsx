import React, { useState } from "react";
import { AlertTriangle, Clock3, Loader2, RefreshCw } from "lucide-react";
import type { OnboardingContract } from "@/services/commercial/OnboardingService";

interface Props {
  contract: OnboardingContract | null;
  onRefresh: () => Promise<void>;
  // Rechazo NO documental (documentsCompleted=true): no hay autoservicio,
  // el siguiente movimiento lo hace VerYGana manualmente.
  rejected?: boolean;
  rejectionReason?: string | null;
}

export function VeryGanaReviewStep({ contract, onRefresh, rejected, rejectionReason }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (rejected) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tu contrato fue rechazado</h3>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            {rejectionReason || "Nuestro equipo de VerYGana revisó tu caso y lo rechazó."}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Nuestro equipo se pondrá en contacto contigo para resolverlo — no hace falta que hagas
            nada más por ahora.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Verificar estado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock3 className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato en revisión</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          Aprobaste tu contrato — ahora el equipo de VerYGana lo está revisando. Te
          notificaremos por correo cuando quede activo.
        </p>
        {contract && (
          <p className="text-xs text-gray-400 mt-3">
            Versión {contract.version} · enviado el{" "}
            {contract.businessApprovedAt
              ? new Date(contract.businessApprovedAt).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Verificar estado
      </button>
    </div>
  );
}

import React, { useState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import type { OnboardingContract } from "@/services/commercial/OnboardingService";

interface Props {
  contract: OnboardingContract | null;
  onRefresh: () => Promise<void>;
}

export function PaymentStep({ contract, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CreditCard className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato firmado — falta el pago</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          Tu contrato ya está firmado. Te contactaremos para completar el pago y activar tu cuenta.
        </p>
        {contract && (
          <p className="text-xs text-gray-400 mt-3">Versión {contract.version}</p>
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

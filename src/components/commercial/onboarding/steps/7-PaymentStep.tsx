import React, { useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import type { OnboardingContract } from "@/services/commercial/OnboardingService";
import { ONBOARDING_PAYMENT_REFERENCE_KEY, StepButton } from "../onboarding.shared";

const AUTO_POLL_MAX_TRIES = 6;
const AUTO_POLL_INTERVAL_MS = 2500;

interface Props {
  contract: OnboardingContract | null;
  submitting: boolean;
  onPay: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function PaymentStep({ contract, submitting, onPay, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Si venimos de vuelta de Wompi (checkout iniciado desde este mismo paso),
  // verificamos el estado unas cuantas veces sin que el usuario tenga que
  // presionar "Verificar estado" — el webhook puede tardar unos segundos en
  // confirmar el pago. Si nunca se completa, se limpia la marca y el usuario
  // se queda en este paso con el botón manual disponible.
  useEffect(() => {
    const reference = sessionStorage.getItem(ONBOARDING_PAYMENT_REFERENCE_KEY);
    if (!reference) return;

    let cancelled = false;
    let tries = 0;

    const poll = async () => {
      if (cancelled) return;
      setAutoChecking(true);
      try {
        await onRefresh();
      } finally {
        if (cancelled) return;
        tries += 1;
        if (tries >= AUTO_POLL_MAX_TRIES) {
          sessionStorage.removeItem(ONBOARDING_PAYMENT_REFERENCE_KEY);
          setAutoChecking(false);
          return;
        }
        setTimeout(poll, AUTO_POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CreditCard className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato firmado — falta el pago</h3>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          {autoChecking
            ? "Estamos verificando tu pago con Wompi..."
            : "Realiza el pago para activar tu cuenta comercial."}
        </p>
        {contract && (
          <p className="text-xs text-gray-400 mt-3">Versión {contract.version}</p>
        )}
      </div>

      <div className="space-y-3">
        <StepButton
          submitting={submitting}
          disabled={autoChecking}
          onClick={onPay}
          label="Pagar ahora"
        />
      </div>
    </div>
  );
}

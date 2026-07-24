'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { OnboardingService, OnboardingStatus } from '@/services/commercial/OnboardingService';
import { OnboardingWizard } from '@/components/commercial/onboarding/OnboardingWizard';
import { useLogout } from '@/hooks/useLogout';

function OnboardingErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No pudimos cargar tu registro</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Ocurrió un error al verificar el estado de tu registro comercial. Intenta de nuevo.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}

// Ruta propia, fuera de /commercial — el onboarding no debe mostrar el
// sidebar/header del panel comercial mientras la cuenta sigue incompleta.
export default function CommercialOnboardingPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { logout } = useLogout();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Evita el doble llamado a getStatus() que provoca React Strict Mode en
  // dev (monta -> limpia -> vuelve a montar cada efecto).
  const hasStartedLoadRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await OnboardingService.getStatus();
      if (result.completed) {
        router.replace('/commercial');
        return;
      }
      setStatus(result);
    } catch (err) {
      console.error('Error cargando estado de onboarding:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (sessionStatus !== 'authenticated') return;
    if (hasStartedLoadRef.current) return;
    hasStartedLoadRef.current = true;
    load();
  }, [sessionStatus, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/logos/logoDorado.png" alt="Ver y Gana" width={32} height={32} />
          <span className="font-bold text-[#0b1440] hidden sm:inline">Ver y Gana</span>
        </div>
        <button
          onClick={logout}
          className="cursor-pointer text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="flex-1 px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <OnboardingErrorState onRetry={load} />
        ) : status ? (
          <OnboardingWizard initialStatus={status} onCompleted={() => router.replace('/commercial')} />
        ) : null}
      </main>
    </div>
  );
}

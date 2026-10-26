'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, Gift, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyRecognitions } from '@/hooks/recognitions/useRecognitions';
import { getRoleHomePath } from '@/lib/auth/roleRedirect';
import { parseRecognitionError } from '@/utils/recognitions';
import ConsumerRecognitionCard from '@/components/consumer/recognitions/ConsumerRecognitionCard';

// "Mis reconocimientos": regalos que VERYGANA le otorgó al usuario. Separado
// de "Mis compras" (estos regalos no aparecen en GET /purchases).
const MyRecognitionsPage = () => {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, isFetching, refetch } = useMyRecognitions(page);

  // Solo CONSUMER.
  useEffect(() => {
    if (!authLoading && role && role !== 'CONSUMER') {
      router.replace(getRoleHomePath(`ROLE_${role}`) ?? '/login');
    }
  }, [authLoading, role, router]);

  const recognitions = data?.data ?? [];
  const meta = data?.meta;
  const loading = authLoading || role !== 'CONSUMER' || isLoading;

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 lg:pb-0">
      {/* HERO */}
      <header className="relative overflow-hidden bg-linear-to-r from-admin-navy via-admin-midnight to-admin-navy text-white">
        <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
            <Gift className="h-3.5 w-3.5 text-admin-yellow" />
            Regalos de VERYGANA
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Mis reconocimientos</h1>
          <p className="max-w-md text-sm text-white/70">
            Productos que VERYGANA adquirió para ti por tu actividad en la plataforma. No pagas dinero ni llaves.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-admin-midnight" />
            <p className="text-sm">Cargando reconocimientos...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <AlertTriangle className="h-6 w-6" />
            <p>{parseRecognitionError(error).message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-admin-midnight px-4 py-2 text-xs font-semibold text-white transition hover:bg-admin-navy"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          </div>
        ) : recognitions.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Gift className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">Aún no tienes reconocimientos</p>
            <p className="mt-1 text-sm text-gray-400">
              Cuando VERYGANA te otorgue un reconocimiento, aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {recognitions.map((r) => (
                <ConsumerRecognitionCard key={r.publicId} recognition={r} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!meta.hasPrevious || isFetching}
                  aria-label="Página anterior"
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">
                  Página {meta.page + 1} de {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNext || isFetching}
                  aria-label="Página siguiente"
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyRecognitionsPage;

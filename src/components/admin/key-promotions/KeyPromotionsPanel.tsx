'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, KeyRound, Loader2, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { keyPromotionKeys, useAdminKeyPromotions } from '@/hooks/keys/useKeyPromotions';
import { formatColombiaDateTime, parseKeysError } from '@/utils/keys';
import { ProsperityPagination, Th } from '@/components/prosperity/ProsperityUI';
import { KeyPromotionFormModal } from './KeyPromotionFormModal';
import { PromotionBudgetBar, PromotionStatusBadge } from './KeyPromotionShared';

// Promociones especiales de llaves (MP-12): listado del admin.
export default function KeyPromotionsPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, isFetching, refetch } = useAdminKeyPromotions(page);

  const promotions = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones de llaves</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">
            Permiten cubrir con llaves más del 50 % ordinario en los productos que los comerciales incorporen,
            durante un tiempo limitado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva promoción
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-admin-blue/10 p-2">
              <KeyRound className="h-4 w-4 text-admin-blue" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Todas las promociones</h2>
          </div>
          {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : isError ? (
          <div className="m-5 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {parseKeysError(error).message}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          </div>
        ) : promotions.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Todavía no hay promociones. Crea la primera.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <Th>Promoción</Th>
                    <Th>Estado</Th>
                    <Th align="right">Cobertura</Th>
                    <Th>Vigencia</Th>
                    <Th align="right">Ofertas</Th>
                    <Th className="min-w-48">Presupuesto consumido</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promotions.map((promotion) => (
                    <tr
                      key={promotion.id}
                      onClick={() => router.push(`/admin/key-promotions/${promotion.id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{promotion.name}</p>
                        <p className="text-xs text-gray-400">#{promotion.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <PromotionStatusBadge status={promotion.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{promotion.coveragePct} %</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {formatColombiaDateTime(promotion.startsAt)}
                        <br />
                        hasta {formatColombiaDateTime(promotion.endsAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{promotion.offers?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <PromotionBudgetBar promotion={promotion} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && <ProsperityPagination meta={data.meta} onPageChange={setPage} loading={isFetching} />}
          </>
        )}
      </section>

      {creating && (
        <KeyPromotionFormModal
          onClose={() => setCreating(false)}
          onSaved={(promotion) => {
            toast.success('Borrador creado. Invita productos antes de autorizarla.');
            queryClient.invalidateQueries({ queryKey: keyPromotionKeys.admin });
            router.push(`/admin/key-promotions/${promotion.id}`);
          }}
        />
      )}
    </div>
  );
}

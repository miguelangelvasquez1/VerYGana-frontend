'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Award, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { useAdminRecognitions, useRecognitionFund, RECOGNITIONS_PAGE_SIZE } from '@/hooks/recognitions/useRecognitions';
import type { RecognitionListParams, RecognitionStatus } from '@/types/recognitions/Recognition.types';
import { formatColombiaDateTime, formatCopCents } from '@/utils/keys';
import { RECOGNITION_STATUS_META, parseRecognitionError } from '@/utils/recognitions';
import { dateToZonedIsoEnd, dateToZonedIsoStart } from '@/lib/utils/dateTime';
import { ProsperityPagination, Th } from '@/components/prosperity/ProsperityUI';
import { inputClass } from '@/components/admin/prosperity/ProsperityModalShell';
import { RecognitionFundCards, RecognitionStatusBadge, UserSearchSelect, type UserOption } from './RecognitionShared';

// Reconocimientos de VERYGANA: listado del admin.
export default function RecognitionsPanel() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<RecognitionStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [beneficiary, setBeneficiary] = useState<UserOption | null>(null);
  const [commercial, setCommercial] = useState<UserOption | null>(null);

  const params = useMemo<RecognitionListParams>(
    () => ({
      status: status || undefined,
      beneficiary: beneficiary?.publicId,
      commercial: commercial?.publicId,
      from: dateToZonedIsoStart(from),
      to: dateToZonedIsoEnd(to),
      page,
      size: RECOGNITIONS_PAGE_SIZE,
      sort: 'createdAt,desc',
    }),
    [status, beneficiary, commercial, from, to, page],
  );

  const fund = useRecognitionFund();
  const { data, isLoading, isError, error, isFetching, refetch } = useAdminRecognitions(params);
  const recognitions = data?.data ?? [];
  const hasFilters = !!(status || from || to || beneficiary || commercial);

  // Cualquier cambio de filtro vuelve a la primera página.
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(0);
    };

  const clearFilters = () => {
    setStatus('');
    setFrom('');
    setTo('');
    setBeneficiary(null);
    setCommercial(null);
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconocimientos</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">
            VERYGANA compra un producto a un empresario con el Fondo de Fortalecimiento y se lo otorga a un usuario
            destacado. El beneficiario no paga dinero ni llaves.
          </p>
        </div>
        <Link
          href="/admin/recognitions/new"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo reconocimiento
        </Link>
      </div>

      {fund.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {parseRecognitionError(fund.error).message}
        </div>
      ) : (
        <RecognitionFundCards fund={fund.data} loading={fund.isLoading} />
      )}

      {/* ── Filtros ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Estado</label>
            <select
              value={status}
              onChange={(e) => withReset(setStatus)(e.target.value as RecognitionStatus | '')}
              className={`${inputClass(false)} cursor-pointer bg-white`}
            >
              <option value="">Todos</option>
              {(Object.keys(RECOGNITION_STATUS_META) as RecognitionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {RECOGNITION_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => withReset(setFrom)(e.target.value)}
              className={inputClass(false)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => withReset(setTo)(e.target.value)}
              className={inputClass(false)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Beneficiario</label>
            <UserSearchSelect
              kind="consumer"
              value={beneficiary}
              onChange={withReset(setBeneficiary)}
              placeholder="Buscar consumidor por email"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Comercio</label>
            <UserSearchSelect
              kind="commercial"
              value={commercial}
              onChange={withReset(setCommercial)}
              placeholder="Buscar comercio por email"
            />
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </section>

      {/* ── Tabla ── */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-admin-blue/10 p-2">
              <Award className="h-4 w-4 text-admin-blue" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Todos los reconocimientos</h2>
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
              {parseRecognitionError(error).message}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          </div>
        ) : recognitions.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {hasFilters ? 'Ningún reconocimiento coincide con los filtros.' : 'Todavía no hay reconocimientos. Crea el primero.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <Th>Fecha</Th>
                    <Th>Beneficiario</Th>
                    <Th>Producto</Th>
                    <Th>Comercio</Th>
                    <Th align="right">Cantidad</Th>
                    <Th align="right">Total</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recognitions.map((r) => (
                    <tr
                      key={r.publicId}
                      onClick={() => router.push(`/admin/recognitions/${r.publicId}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {formatColombiaDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.beneficiaryName}</td>
                      <td className="px-4 py-3 text-gray-700">{r.productName}</td>
                      <td className="px-4 py-3 text-gray-700">{r.commercialName ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCopCents(r.totalCents)}
                      </td>
                      <td className="px-4 py-3">
                        <RecognitionStatusBadge status={r.status} />
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
    </div>
  );
}

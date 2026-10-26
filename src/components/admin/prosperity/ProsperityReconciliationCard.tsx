'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Loader2, Scale, XCircle } from 'lucide-react';
import { reconcile } from '@/services/admin/AdminProsperityService';
import { parseProsperityError } from '@/utils/prosperity';

// Conciliación de Prosperidad: revisa TODAS las cuentas (Saldo vs. Libro
// Mayor), por eso vive en Finanzas y no en la pestaña del empresario.
export function ProsperityReconciliationCard() {
  const mutation = useMutation({ mutationFn: reconcile });
  const result = mutation.data;
  const discrepancies = result?.discrepancies ?? [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-admin-blue/10 p-2">
            <Scale className="h-5 w-5 text-admin-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Conciliación de Prosperidad</h3>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-gray-500">
              Verifica que el Saldo de cada empresario coincida con su Libro Mayor. También se ejecuta automáticamente
              cada día a las 2:00 a. m.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? 'Ejecutando…' : 'Ejecutar conciliación'}
        </button>
      </div>

      {mutation.isError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {parseProsperityError(mutation.error).message}
        </p>
      )}

      {result && !mutation.isPending && discrepancies.length === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {result.accountsChecked} cuentas verificadas, sin descuadres
        </div>
      )}

      {result && !mutation.isPending && discrepancies.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <XCircle className="h-4 w-4 shrink-0" />
            {discrepancies.length} descuadres en {result.accountsChecked} cuentas
          </p>
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg bg-white/70 p-2 font-mono text-xs text-red-900">
            {discrepancies.map((d, i) => (
              <li key={i} className="break-all">
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs font-medium text-red-700">Reportar al equipo de backend</p>
        </div>
      )}
    </div>
  );
}

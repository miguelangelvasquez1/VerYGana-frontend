'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Hourglass, Loader2, Scale, XCircle } from 'lucide-react';
import ConfirmDialog from '@/components/generic/ConfirmDialog';
import { reconcileKeyLedger, runExpiry } from '@/services/admin/AdminKeyLedgerService';
import { centsToKeys, colombiaInputToIso, formatColombiaDateTime, formatKeys, parseKeysError } from '@/utils/keys';

// El backend rechaza `asOf` en producción (422): el campo solo existe en desarrollo.
const IS_DEV = process.env.NODE_ENV === 'development';

const buttonClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

// ─── Vencimiento ─────────────────────────────────────────────────────────────

function KeyExpiryCard() {
  const [asOf, setAsOf] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useMutation({ mutationFn: (asOfIso?: string) => runExpiry(asOfIso) });
  const result = mutation.data;
  const asOfIso = IS_DEV ? colombiaInputToIso(asOf) : undefined;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-admin-blue/10 p-2">
            <Hourglass className="h-5 w-5 text-admin-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Vencimiento de llaves</h3>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-gray-500">
              Ejecuta ahora el proceso que vence las llaves cuya fecha de expiración ya pasó.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={mutation.isPending}
          className={buttonClass}
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? 'Ejecutando…' : 'Ejecutar vencimiento'}
        </button>
      </div>

      {IS_DEV && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3">
          <label htmlFor="key-expiry-as-of" className="block text-xs font-semibold text-amber-800">
            Simular fecha (solo desarrollo, hora de Colombia)
          </label>
          <input
            id="key-expiry-as-of"
            type="datetime-local"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            disabled={mutation.isPending}
            className="mt-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-200"
          />
          <p className="mt-1 text-xs text-amber-700">
            Vence las llaves como si fuera esa fecha. Déjalo vacío para usar la fecha actual.
          </p>
        </div>
      )}

      {mutation.isError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {parseKeysError(mutation.error).message}
        </p>
      )}

      {result && !mutation.isPending && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Evaluado al {formatColombiaDateTime(result.evaluatedAt)}
            {result.simulated && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                Simulado
              </span>
            )}
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-gray-500">Billeteras procesadas</dt>
              <dd className="text-lg font-bold text-gray-900">{result.walletsWithDueLots.toLocaleString('es-CO')}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Billeteras fallidas</dt>
              <dd className={`text-lg font-bold ${result.walletsFailed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {result.walletsFailed.toLocaleString('es-CO')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Llaves vencidas</dt>
              <dd className="text-lg font-bold text-gray-900">{formatKeys(centsToKeys(result.expiredCents))}</dd>
            </div>
          </dl>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Ejecutar vencimiento de llaves"
        description={
          asOfIso
            ? `Se vencerán las llaves como si fuera el ${formatColombiaDateTime(asOfIso)}. Esta acción no se puede deshacer.`
            : 'Se vencerán ahora todas las llaves cuya fecha de expiración ya pasó. Esta acción no se puede deshacer.'
        }
        confirmText="Ejecutar"
        variant="warning"
        onConfirm={() => mutation.mutate(asOfIso)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ─── Conciliación ────────────────────────────────────────────────────────────

function WalletIdList({ title, ids }: { title: string; ids: Array<string | number> }) {
  if (ids.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-red-800">
        {title} ({ids.length})
      </p>
      <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-lg bg-white/70 p-2 font-mono text-xs text-red-900">
        {ids.map((id) => (
          <li key={String(id)} className="break-all">
            {String(id)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyLedgerReconciliationCard() {
  const mutation = useMutation({ mutationFn: reconcileKeyLedger });
  const result = mutation.data;
  // El estado se calcula solo a partir de las dos listas.
  const outOfSync = result?.walletsOutOfSyncWithLedger ?? [];
  const aboveBalance = result?.walletsWithLotsAboveBalance ?? [];
  const reconciled = outOfSync.length === 0 && aboveBalance.length === 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-admin-blue/10 p-2">
            <Scale className="h-5 w-5 text-admin-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Conciliación del libro de llaves</h3>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-gray-500">
              Verifica que el saldo de llaves de cada billetera coincida con su libro y con sus lotes vigentes.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className={buttonClass}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? 'Ejecutando…' : 'Ejecutar conciliación'}
        </button>
      </div>

      {mutation.isError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {parseKeysError(mutation.error).message}
        </p>
      )}

      {result && !mutation.isPending && reconciled && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Libro de llaves conciliado sin descuadres
        </div>
      )}

      {result && !mutation.isPending && !reconciled && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <XCircle className="h-4 w-4 shrink-0" />
            Se encontraron descuadres en el libro de llaves
          </p>
          <WalletIdList title="Billeteras descuadradas frente al libro" ids={outOfSync} />
          <WalletIdList title="Billeteras con lotes por encima del saldo" ids={aboveBalance} />
        </div>
      )}
    </div>
  );
}

// Herramientas del libro de llaves (MP-12): operación y pruebas.
export function KeyLedgerToolsCard() {
  return (
    <>
      <KeyExpiryCard />
      <KeyLedgerReconciliationCard />
    </>
  );
}

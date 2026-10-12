'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronRight, Info, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { keyPromotionKeys, useKeyPromotionOffers } from '@/hooks/keys/useKeyPromotions';
import { acceptOffer, rejectOffer, withdrawOffer } from '@/services/commercial/KeyPromotionOffersService';
import type { KeyPromotionOfferDTO } from '@/types/keys/KeyPromotion.types';
import {
  formatColombiaDateTime,
  formatCopCents,
  getOfferStatusMeta,
  getPromotionStatusMeta,
  parseKeysError,
} from '@/utils/keys';
import { ProsperityModalShell } from '@/components/admin/prosperity/ProsperityModalShell';

// Invitaciones a promociones especiales de llaves (MP-12).
//
// OJO (exigencia del contrato): el comercial no participa hasta que acepta, y
// debe ver TODAS las condiciones antes de aceptar.

export const KEYS_DO_NOT_REDUCE_SALE_NOTE =
  'Las llaves no reducen tu venta: VerYGana te reconoce el precio completo.';

function StatusBadge({ label, classes }: { label: string; classes: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function ConditionRow({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <dt className="text-sm text-gray-600">{label}</dt>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <dd className="shrink-0 text-right text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

// Todas las condiciones de la oferta. Se reutiliza en el detalle del admin.
export function OfferConditions({ offer }: { offer: KeyPromotionOfferDTO }) {
  return (
    <dl className="divide-y divide-gray-100">
      <ConditionRow label="Precio de la oferta" value={formatCopCents(offer.priceCents)} />
      <ConditionRow
        label="Tope de llaves"
        hint="Ordinario frente al de la promoción"
        value={
          <>
            <span className="font-normal text-gray-400">{offer.ordinaryKeysPct} % →</span> {offer.promotionKeysPct} %
          </>
        }
      />
      <ConditionRow label="Cobertura máxima con llaves" value={formatCopCents(offer.maxKeysCoverageCents)} />
      <ConditionRow label="Dinero mínimo a cargo del usuario" value={formatCopCents(offer.minUserCashCents)} />
      <ConditionRow
        label="Comisión estimada"
        hint={`${offer.commissionPct} % del precio · Calculado sin Saldo de Prosperidad`}
        value={formatCopCents(offer.estimatedCommissionCents)}
      />
      <ConditionRow label="Valor reconocido a ti" value={formatCopCents(offer.estimatedNetToCommercialCents)} />
      <ConditionRow
        label="Vigencia"
        value={
          <>
            {formatColombiaDateTime(offer.startsAt)}
            <br />
            hasta {formatColombiaDateTime(offer.endsAt)}
          </>
        }
      />
    </dl>
  );
}

// ─── Detalle + acciones ──────────────────────────────────────────────────────

type OfferAction = 'accept' | 'reject' | 'withdraw';

const ACTIONS: Record<OfferAction, { run: (id: number) => Promise<KeyPromotionOfferDTO>; success: string }> = {
  accept: { run: acceptOffer, success: 'Oferta incorporada a la promoción' },
  reject: { run: rejectOffer, success: 'Invitación rechazada' },
  withdraw: { run: withdrawOffer, success: 'Te retiraste de la promoción' },
};

function OfferDetailModal({ offer, onClose }: { offer: KeyPromotionOfferDTO; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [accepted, setAccepted] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [showProsperityInfo, setShowProsperityInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (action: OfferAction) => ACTIONS[action].run(offer.offerId),
    onSuccess: (_updated, action) => {
      toast.success(ACTIONS[action].success);
      queryClient.invalidateQueries({ queryKey: keyPromotionKeys.offers });
      onClose();
    },
    onError: (err) => {
      setError(parseKeysError(err).message);
      // 409: la oferta o la promoción cambiaron de estado; se recarga la lista.
      queryClient.invalidateQueries({ queryKey: keyPromotionKeys.offers });
    },
  });

  const run = (action: OfferAction) => {
    setError(null);
    mutation.mutate(action);
  };

  const busy = mutation.isPending;
  const pending = offer.status === 'PENDING_ACCEPTANCE';
  const isAccepted = offer.status === 'ACCEPTED';
  const offerMeta = getOfferStatusMeta(offer.status);
  const promotionMeta = getPromotionStatusMeta(offer.promotionStatus);

  const secondaryButton =
    'cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50';
  const primaryButton =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#03548C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b1440] disabled:cursor-not-allowed disabled:opacity-50';
  const dangerButton =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <ProsperityModalShell
      title={offer.promotionName}
      subtitle={offer.productName}
      onClose={onClose}
      busy={busy}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>
            Cerrar
          </button>
          {pending && (
            <>
              <button type="button" onClick={() => run('reject')} disabled={busy} className={dangerButton}>
                Rechazar
              </button>
              <button type="button" onClick={() => run('accept')} disabled={busy || !accepted} className={primaryButton}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Aceptar oferta
              </button>
            </>
          )}
          {isAccepted && (
            <button
              type="button"
              onClick={() => run('withdraw')}
              disabled={busy || !confirmWithdraw}
              className={dangerButton}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Retirarme de la promoción
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge {...offerMeta} />
        <StatusBadge label={`Promoción: ${promotionMeta.label}`} classes={promotionMeta.classes} />
        {offer.respondedAt && (
          <span className="text-xs text-gray-400">Respondida el {formatColombiaDateTime(offer.respondedAt)}</span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {pending
          ? 'Estos son los valores vigentes hoy. Todavía no participas: tu producto solo se incorpora si aceptas.'
          : isAccepted
            ? 'Estos son los valores que aceptaste; se mantienen aunque cambie el precio del producto.'
            : 'Condiciones de la invitación.'}
      </p>

      <OfferConditions offer={offer} />

      <div>
        <button
          type="button"
          onClick={() => setShowProsperityInfo((v) => !v)}
          aria-expanded={showProsperityInfo}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#03548C] hover:underline"
        >
          <Info className="h-4 w-4" />
          ¿Cómo participa mi Saldo de Prosperidad?
        </button>
        {showProsperityInfo && (
          <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>Tu Saldo de Prosperidad participa igual que siempre durante la promoción.</p>
            <p>
              Los valores de este detalle están calculados bajo la premisa de que tu Saldo de Prosperidad está en
              cero. Si tienes saldo, se aplica a cada venta y absorbe la comisión que retiene VerYGana.
            </p>
          </div>
        )}
      </div>

      {/* El saldo es solo contexto: los valores de arriba no lo incluyen ni se recalculan con él. */}
      {offer.prosperityBalanceCents > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Tienes Saldo de Prosperidad: {formatCopCents(offer.prosperityBalanceCents)}</p>
          <p className="mt-1">
            Tu saldo también se aplica a las ventas de esta promoción. Mientras lo tengas, absorbe el valor de cada
            venta y la comisión que pagas es menor o incluso cero. Los valores de arriba no lo incluyen.
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700">Términos</p>
        <p className="mt-1 whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          {offer.termsText || 'Esta promoción no tiene términos adicionales.'}
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#03548C]" />
        <p>{KEYS_DO_NOT_REDUCE_SALE_NOTE}</p>
      </div>

      {pending && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={busy}
            className="mt-0.5 accent-[#03548C]"
          />
          Acepto incorporar esta oferta con estas condiciones
        </label>
      )}

      {isAccepted && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={confirmWithdraw}
            onChange={(e) => setConfirmWithdraw(e.target.checked)}
            disabled={busy}
            className="mt-0.5 accent-amber-600"
          />
          Entiendo que retirarme aplica solo a compras futuras; las compras ya hechas no cambian.
        </label>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </ProsperityModalShell>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export function KeyPromotionOffersPage() {
  const { data: offers, isLoading, isError, error, refetch, isFetching } = useKeyPromotionOffers();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = offers?.find((o) => o.offerId === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-[#03548C] to-[#0b1440] p-6 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[#FFD700]" />
          <h1 className="text-lg font-semibold">Promociones de Llaves</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
          Invitaciones para que tus productos permitan a los usuarios cubrir con Llaves un porcentaje mayor al
          ordinario durante un tiempo limitado. Solo participas en las que aceptes.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#03548C]" />
        <p className="text-sm leading-relaxed text-blue-900">{KEYS_DO_NOT_REDUCE_SALE_NOTE}</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mis invitaciones</h2>
            <p className="text-xs text-gray-500">De la más reciente a la más antigua</p>
          </div>
          {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : isError ? (
          <div className="m-5 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{parseKeysError(error).message}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          </div>
        ) : !offers || offers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            Todavía no tienes invitaciones a promociones especiales.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {offers.map((offer) => {
              const meta = getOfferStatusMeta(offer.status);
              const promotionMeta = getPromotionStatusMeta(offer.promotionStatus);
              return (
                <li key={offer.offerId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(offer.offerId)}
                    className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{offer.promotionName}</p>
                        <StatusBadge {...meta} />
                        {offer.promotionStatus !== 'AUTHORIZED' && (
                          <StatusBadge label={`Promoción ${promotionMeta.label.toLowerCase()}`} classes={promotionMeta.classes} />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-600">
                        {offer.productName} · {formatCopCents(offer.priceCents)}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span>
                          Tope de llaves: {offer.ordinaryKeysPct} % → {offer.promotionKeysPct} %
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          Hasta {formatColombiaDateTime(offer.endsAt)}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected && <OfferDetailModal key={selected.offerId} offer={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

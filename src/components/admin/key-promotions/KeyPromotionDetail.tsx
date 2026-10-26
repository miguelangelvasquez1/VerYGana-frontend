'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/generic/ConfirmDialog';
import { keyPromotionKeys, useAdminKeyPromotion } from '@/hooks/keys/useKeyPromotions';
import {
  inviteProduct,
  removeOffer,
  transitionPromotion,
  type KeyPromotionTransition,
} from '@/services/admin/AdminKeyPromotionService';
import { getAllProductsForAdmin } from '@/services/admin/AdminProductsService';
import { ProductStatus } from '@/types/products/Product.types';
import type { KeyPromotionOfferDTO, KeyPromotionResponseDTO } from '@/types/keys/KeyPromotion.types';
import { CENTS_PER_KEY, ORDINARY_KEYS_PCT, formatColombiaDateTime, formatCopCents, parseKeysError } from '@/utils/keys';
import { formatBudget } from '@/utils/currency';
import { Th } from '@/components/prosperity/ProsperityUI';
import { ProsperityModalShell, inputClass } from '@/components/admin/prosperity/ProsperityModalShell';
import { KeyPromotionFormModal } from './KeyPromotionFormModal';
import { OfferStatusBadge, PromotionBudgetBar, PromotionStatusBadge } from './KeyPromotionShared';

// ─── Invitar producto ────────────────────────────────────────────────────────

function InviteProductModal({
  promotion,
  onClose,
  onInvited,
}: {
  promotion: KeyPromotionResponseDTO;
  onClose: () => void;
  onInvited: (promotion: KeyPromotionResponseDTO) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'products', 'key-promotion-picker', search],
    queryFn: () => getAllProductsForAdmin(ProductStatus.ACTIVE, search || undefined, 0, 10),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (productId: number) => inviteProduct(promotion.id, productId),
    onSuccess: (updated) => {
      toast.success('Producto invitado a la promoción');
      onInvited(updated);
    },
    // 422: producto inactivo, de un comercial que no es STANDARD o ya en otra promoción abierta.
    onError: (err) => setError(parseKeysError(err).message),
  });

  const invitedIds = new Set(promotion.offers.map((o) => o.productId));
  const products = data?.data ?? [];

  return (
    <ProsperityModalShell
      title="Invitar producto"
      subtitle="Solo productos activos de comerciales con plan Estándar. El comercial debe aceptar para participar."
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar producto por nombre"
          autoFocus
          className={`${inputClass(false)} pl-9`}
        />
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-red-600">No se pudieron cargar los productos.</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No hay productos activos que coincidan.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {products.map((product) => {
            const alreadyInvited = invitedIds.has(product.id);
            const inviting = mutation.isPending && mutation.variables === product.id;
            return (
              <li key={product.id} className="flex items-center gap-3 p-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    #{product.id} · {product.companyName} · {formatBudget(product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    mutation.mutate(product.id);
                  }}
                  disabled={alreadyInvited || mutation.isPending}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-admin-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {alreadyInvited ? 'Invitado' : 'Invitar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ProsperityModalShell>
  );
}

// ─── Detalle ─────────────────────────────────────────────────────────────────

type PendingConfirm =
  | { kind: 'transition'; transition: KeyPromotionTransition }
  | { kind: 'removeOffer'; offer: KeyPromotionOfferDTO };

const TRANSITION_COPY: Record<
  KeyPromotionTransition,
  {
    title: string;
    description: (p: KeyPromotionResponseDTO) => string;
    confirmText: string;
    variant: 'default' | 'danger' | 'warning';
    success: string;
  }
> = {
  authorize: {
    title: 'Autorizar promoción',
    description: (p) =>
      `Se apartará ${formatCopCents(p.budgetCents)} del Fondo de Fortalecimiento como garantía. Lo no usado vuelve al cerrar la promoción.`,
    confirmText: 'Autorizar',
    variant: 'warning',
    success: 'Promoción autorizada. Los comerciales invitados fueron notificados.',
  },
  pause: {
    title: 'Pausar promoción',
    description: () => 'Mientras esté pausada, los productos vuelven al tope ordinario de llaves. Puedes reanudarla después.',
    confirmText: 'Pausar',
    variant: 'warning',
    success: 'Promoción pausada',
  },
  resume: {
    title: 'Reanudar promoción',
    description: () => 'La promoción vuelve a aplicar dentro de sus fechas de vigencia.',
    confirmText: 'Reanudar',
    variant: 'warning',
    success: 'Promoción reanudada',
  },
  end: {
    title: 'Cerrar promoción definitivamente',
    description: (p) =>
      p.reservedCents > 0
        ? `La promoción se cierra para siempre y no se puede reabrir. Hay ${formatCopCents(p.reservedCents)} reservados por compras con pago en curso: la garantía no usada vuelve al Fondo de Fortalecimiento cuando esos pagos se resuelvan.`
        : 'La promoción se cierra para siempre y no se puede reabrir. La garantía no usada vuelve al Fondo de Fortalecimiento.',
    confirmText: 'Cerrar promoción',
    variant: 'danger',
    success: 'Promoción cerrada',
  },
};

// Lo que una unidad del producto consume del presupuesto si el usuario aplica el
// máximo: la cobertura de la promoción menos el tope ordinario, en llaves enteras.
const unitExcessCents = (offer: KeyPromotionOfferDTO): number => {
  const ordinaryLimit =
    Math.floor((offer.priceCents * offer.ordinaryKeysPct) / 100 / CENTS_PER_KEY) * CENTS_PER_KEY;
  return offer.maxKeysCoverageCents - ordinaryLimit;
};

// Motivos por los que un borrador no se puede (o no tiene sentido) autorizar.
function getDraftProblems(promotion: KeyPromotionResponseDTO): string[] {
  const problems: string[] = [];
  const offers = promotion.offers ?? [];

  if (new Date(promotion.endsAt).getTime() <= Date.now()) {
    problems.push('La vigencia ya terminó. Edita las fechas antes de autorizar.');
  }
  if (offers.length === 0) {
    problems.push('Invita al menos un producto: la promoción solo aplica a las ofertas incorporadas.');
  }
  offers.forEach((offer) => {
    const excess = unitExcessCents(offer);
    if (excess <= 0) {
      problems.push(`"${offer.productName}" no gana cobertura con esta promoción: su tope ya es igual o mayor.`);
    } else if (excess > promotion.budgetCents) {
      problems.push(
        `El presupuesto no alcanza para una sola unidad de "${offer.productName}" (necesita ${formatCopCents(excess)}): la promoción nunca le aplicaría.`,
      );
    } else if (promotion.maxExcessCentsPerUser != null && excess > promotion.maxExcessCentsPerUser) {
      problems.push(
        `El límite por usuario no alcanza para una unidad de "${offer.productName}" (necesita ${formatCopCents(excess)}): ningún usuario podría usarla.`,
      );
    }
  });
  return problems;
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{children}</dd>
    </div>
  );
}

export default function KeyPromotionDetail({ promotionId }: { promotionId: number }) {
  const queryClient = useQueryClient();
  const { data: promotion, isLoading, isError, error, refetch } = useAdminKeyPromotion(promotionId);
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  // Toda operación devuelve la promoción actualizada.
  const applyUpdate = (updated: KeyPromotionResponseDTO) => {
    queryClient.setQueryData(keyPromotionKeys.adminDetail(promotionId), updated);
    queryClient.invalidateQueries({ queryKey: ['admin', 'key-promotions', 'list'] });
    // Autorizar y cerrar mueven la garantía entre bolsillos de tesorería.
    queryClient.invalidateQueries({ queryKey: ['treasury', 'balance'] });
  };

  const backLink = (
    <Link
      href="/admin/key-promotions"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Promociones de llaves
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        {backLink}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    );
  }

  const isDraft = promotion.status === 'DRAFT';
  const offers = promotion.offers ?? [];
  const draftProblems = isDraft ? getDraftProblems(promotion) : [];
  // Cerrada, pero con la garantía todavía en el bolsillo de promociones.
  const guaranteePending =
    promotion.status === 'ENDED' && promotion.authorizedAt != null && promotion.guaranteeReturnedAt == null;

  const handleConfirm = async () => {
    if (!confirm) return;
    // ConfirmDialog muestra el `message` del backend si esto falla (409 / 422).
    if (confirm.kind === 'transition') {
      applyUpdate(await transitionPromotion(promotion.id, confirm.transition));
      toast.success(TRANSITION_COPY[confirm.transition].success);
    } else {
      applyUpdate(await removeOffer(promotion.id, confirm.offer.offerId));
      toast.success('Oferta quitada de la promoción');
    }
  };

  const actionButton =
    'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {backLink}

      {/* ── Encabezado y acciones según el estado ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{promotion.name}</h1>
            <PromotionStatusBadge status={promotion.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Hasta {promotion.coveragePct} % con llaves · {formatColombiaDateTime(promotion.startsAt)} hasta{' '}
            {formatColombiaDateTime(promotion.endsAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <button type="button" onClick={() => setEditing(true)} className={actionButton}>
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ kind: 'transition', transition: 'authorize' })}
                disabled={draftProblems.length > 0}
                title={draftProblems.length > 0 ? 'Resuelve los pendientes antes de autorizar' : undefined}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Autorizar
              </button>
            </>
          )}
          {promotion.status === 'AUTHORIZED' && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'transition', transition: 'pause' })}
              className={actionButton}
            >
              <Pause className="h-4 w-4" />
              Pausar
            </button>
          )}
          {promotion.status === 'PAUSED' && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'transition', transition: 'resume' })}
              className={actionButton}
            >
              <Play className="h-4 w-4" />
              Reanudar
            </button>
          )}
          {promotion.status !== 'ENDED' && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'transition', transition: 'end' })}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50"
            >
              <Ban className="h-4 w-4" />
              Cerrar
            </button>
          )}
        </div>
      </div>

      {isDraft && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p>
              Esta promoción es un borrador y no tiene efecto hasta que la autorices; al hacerlo, los comerciales
              reciben la invitación.
            </p>
            {draftProblems.length > 0 && (
              <>
                <p className="mt-2 font-semibold">Antes de autorizar:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {draftProblems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Presupuesto ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Presupuesto</h2>
            <p className="text-xs text-gray-500">
              Tope de lo que los usuarios pueden cubrir con llaves por encima del {ORDINARY_KEYS_PCT} % ordinario
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCopCents(promotion.budgetCents)}</p>
        </div>
        <PromotionBudgetBar promotion={promotion} />

        {guaranteePending && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Garantía pendiente de devolución.</strong>{' '}
              {promotion.reservedCents > 0
                ? `Hay ${formatCopCents(promotion.reservedCents)} reservados por compras con pago en curso. Cuando esos pagos se aprueben o venzan, lo no usado (${formatCopCents(promotion.budgetCents - promotion.guaranteeDrawnCents)} como máximo) vuelve automáticamente al Fondo de Fortalecimiento.`
                : 'Ya no quedan compras en curso: lo no usado vuelve al Fondo de Fortalecimiento en la próxima revisión automática (cada 30 minutos).'}
            </span>
          </p>
        )}

        {promotion.guaranteeReturnedAt && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Garantía devuelta el {formatColombiaDateTime(promotion.guaranteeReturnedAt)}
          </p>
        )}
      </section>

      {/* ── Configuración ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Configuración</h2>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <InfoItem label="Cobertura con llaves">{promotion.coveragePct} %</InfoItem>
          <InfoItem label="Límite por usuario">
            {promotion.maxExcessCentsPerUser != null ? formatCopCents(promotion.maxExcessCentsPerUser) : 'Sin límite'}
          </InfoItem>
          <InfoItem label="Garantía usada">{formatCopCents(promotion.guaranteeDrawnCents)}</InfoItem>
          <InfoItem label="Autorizada">
            {promotion.authorizedAt ? formatColombiaDateTime(promotion.authorizedAt) : 'Aún no'}
          </InfoItem>
          <InfoItem label="Inicio">{formatColombiaDateTime(promotion.startsAt)}</InfoItem>
          <InfoItem label="Fin">{formatColombiaDateTime(promotion.endsAt)}</InfoItem>
          <InfoItem label="Versión de configuración">{promotion.configVersion}</InfoItem>
        </dl>
        <div className="mt-4">
          <p className="text-xs text-gray-500">Términos</p>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
            {promotion.termsText || 'Sin términos adicionales.'}
          </p>
        </div>
      </section>

      {/* ── Ofertas ── */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ofertas ({offers.length})</h2>
            <p className="text-xs text-gray-500">
              Un comercial solo participa cuando acepta su invitación
            </p>
          </div>
          {isDraft && (
            <button type="button" onClick={() => setInviting(true)} className={actionButton}>
              <Plus className="h-4 w-4" />
              Invitar producto
            </button>
          )}
        </div>

        {offers.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {isDraft ? 'Aún no has invitado productos.' : 'Esta promoción no tiene ofertas.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <Th>Producto</Th>
                  <Th>Estado</Th>
                  <Th align="right">Precio</Th>
                  <Th align="right">Tope de llaves</Th>
                  <Th align="right">Cobertura máx.</Th>
                  <Th align="right">Dinero mín. usuario</Th>
                  <Th align="right">Comisión est.</Th>
                  <Th align="right">Neto al comercial</Th>
                  {isDraft && <Th align="right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {offers.map((offer) => (
                  <tr key={offer.offerId}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{offer.productName}</p>
                      <p className="text-xs text-gray-400">Producto #{offer.productId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <OfferStatusBadge status={offer.status} />
                      {offer.respondedAt && (
                        <p className="mt-1 whitespace-nowrap text-xs text-gray-400">
                          {formatColombiaDateTime(offer.respondedAt)}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                      {formatCopCents(offer.priceCents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                      <span className="text-gray-400">{offer.ordinaryKeysPct} % →</span> {offer.promotionKeysPct} %
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                      {formatCopCents(offer.maxKeysCoverageCents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                      {formatCopCents(offer.minUserCashCents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                      {formatCopCents(offer.estimatedCommissionCents)}
                      <span className="ml-1 text-xs text-gray-400">({offer.commissionPct} %)</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCopCents(offer.estimatedNetToCommercialCents)}
                    </td>
                    {isDraft && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setConfirm({ kind: 'removeOffer', offer })}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Quitar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <KeyPromotionFormModal
          promotion={promotion}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            applyUpdate(updated);
            toast.success('Promoción actualizada');
            setEditing(false);
          }}
        />
      )}

      {inviting && (
        <InviteProductModal promotion={promotion} onClose={() => setInviting(false)} onInvited={applyUpdate} />
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        title={
          confirm?.kind === 'transition'
            ? TRANSITION_COPY[confirm.transition].title
            : 'Quitar oferta de la promoción'
        }
        description={
          confirm?.kind === 'transition'
            ? TRANSITION_COPY[confirm.transition].description(promotion)
            : confirm?.kind === 'removeOffer'
              ? `Se quitará "${confirm.offer.productName}" de esta promoción.`
              : undefined
        }
        confirmText={confirm?.kind === 'transition' ? TRANSITION_COPY[confirm.transition].confirmText : 'Quitar'}
        variant={confirm?.kind === 'transition' ? TRANSITION_COPY[confirm.transition].variant : 'danger'}
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

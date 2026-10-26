'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { recognitionKeys, useAdminRecognition } from '@/hooks/recognitions/useRecognitions';
import { cancelRecognition } from '@/services/admin/AdminRecognitionService';
import type { RecognitionDetail as RecognitionDetailDTO, RecognitionDetailItem } from '@/types/recognitions/Recognition.types';
import { Role } from '@/types/User.types';
import { formatColombiaDate, formatColombiaDateTime, formatCopCents } from '@/utils/keys';
import {
  CRITERION_LABEL,
  MAX_CAUSE_LENGTH,
  SALE_COMPONENT_TYPE_LABEL,
  SALE_PAYER_LABEL,
  formatMetric,
  parseRecognitionError,
} from '@/utils/recognitions';
import { purchaseItemStatusColor, purchaseItemStatusLabel } from '@/components/purchases/purchaseItemMeta';
import { Th } from '@/components/prosperity/ProsperityUI';
import { FieldError, ProsperityModalShell, inputClass } from '@/components/admin/prosperity/ProsperityModalShell';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import { Badge, ComputableStatusBadge, InfoItem, PaidOutBadge, RecognitionStatusBadge } from './RecognitionShared';

// Anular solo si está vigente y nada se le ha pagado aún al comercio.
export const canCancelRecognition = (r: Pick<RecognitionDetailDTO, 'status' | 'items'>) =>
  (r.status === 'PURCHASED' || r.status === 'DELIVERED') && !r.items.some((i) => i.paidOut);

// ─── Modal de anulación ──────────────────────────────────────────────────────

function CancelRecognitionModal({
  recognition,
  onClose,
  onCancelled,
}: {
  recognition: RecognitionDetailDTO;
  onClose: () => void;
  onCancelled: (updated: RecognitionDetailDTO) => void;
}) {
  const [cause, setCause] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = cause.trim();
  const causeError = trimmed.length === 0 ? 'La causa es obligatoria.' : null;

  const mutation = useMutation({
    mutationFn: () => cancelRecognition(recognition.publicId, trimmed),
    onSuccess: (updated) => {
      toast.success('Reconocimiento anulado. El dinero volvió al fondo.');
      onCancelled(updated);
    },
    // 409: "ya fue pagado al comercio" o "ya está cerrado".
    onError: (err) => {
      const parsed = parseRecognitionError(err);
      setError(parsed.fieldErrors.cause ?? parsed.message);
    },
  });

  const submit = () => {
    setTouched(true);
    if (causeError || mutation.isPending) return;
    setError(null);
    mutation.mutate();
  };

  return (
    <ProsperityModalShell
      title="Anular reconocimiento"
      subtitle={`${recognition.items[0]?.productName ?? 'Producto'} para ${recognition.beneficiaryName}`}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={mutation.isPending || (touched && !!causeError)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Anular
          </button>
        </div>
      }
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <p>
          Al anular, los {formatCopCents(recognition.totalCents)} vuelven al Fondo de Fortalecimiento y la comisión
          de la venta se revierte. El beneficiario ya no podrá reclamar el producto.
        </p>
      </div>

      <div>
        <label htmlFor="cancel-cause" className="mb-1 block text-sm font-medium text-gray-700">
          Causa <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cancel-cause"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={MAX_CAUSE_LENGTH}
          rows={3}
          autoFocus
          disabled={mutation.isPending}
          placeholder="Ej.: El comercio no tiene cómo entregar el producto."
          className={inputClass(touched && !!causeError)}
        />
        <FieldError message={touched ? (causeError ?? undefined) : undefined} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </ProsperityModalShell>
  );
}

// ─── Ítems ───────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: RecognitionDetailItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="cursor-pointer align-top transition-colors hover:bg-gray-50" onClick={() => setOpen((o) => !o)}>
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            {open ? (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <div>
              <p className="font-semibold text-gray-900">{item.productName}</p>
              <p className="text-xs text-gray-400">Ítem #{item.itemId}</p>
              {item.paidOut && (
                <div className="mt-1">
                  <PaidOutBadge />
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge
            label={purchaseItemStatusLabel[item.status] ?? item.status}
            classes={`${purchaseItemStatusColor[item.status] ?? 'bg-gray-100 text-gray-600'} border-transparent`}
          />
        </td>
        <td className="px-4 py-3">
          <ComputableStatusBadge status={item.computableStatus} />
          {item.recognizedAt && (
            <p className="mt-1 whitespace-nowrap text-xs text-gray-400">{formatColombiaDateTime(item.recognizedAt)}</p>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">{formatCopCents(item.subtotalCents)}</td>
        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
          {item.commissionBaseCents != null ? formatCopCents(item.commissionBaseCents) : '—'}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
          {formatCopCents(item.commissionCents)}
          <span className="ml-1 text-xs text-gray-400">({item.commissionPctApplied} %)</span>
          {item.commissionVatCents > 0 && (
            <p className="text-xs text-gray-400">IVA {formatCopCents(item.commissionVatCents)}</p>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
          {formatCopCents(item.netToCommercialCents)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
          <p>Entregado: {formatColombiaDateTime(item.deliveredAt)}</p>
          <p>Reclamado: {formatColombiaDateTime(item.claimedAt)}</p>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
          {item.claimExpiresAt ? formatColombiaDateTime(item.claimExpiresAt) : '—'}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/60">
          <td colSpan={9} className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Componentes de la venta</p>
            {item.components.length === 0 ? (
              <p className="text-xs text-gray-400">Sin componentes registrados.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-4 font-medium">Tipo</th>
                    <th className="py-1 pr-4 font-medium">Aportante</th>
                    <th className="py-1 pr-4 text-right font-medium">Monto</th>
                    <th className="py-1 pr-4 font-medium">Estado</th>
                    <th className="py-1 pr-4 font-medium">Referencia</th>
                    <th className="py-1 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.components.map((c, idx) => {
                    const reversed = c.status === 'REVERSED';
                    return (
                      <tr key={`${c.sourceRef}-${idx}`} className={reversed ? 'text-red-600 line-through' : 'text-gray-700'}>
                        <td className="py-1.5 pr-4">{SALE_COMPONENT_TYPE_LABEL[c.type] ?? c.type}</td>
                        <td className="py-1.5 pr-4">{SALE_PAYER_LABEL[c.payer] ?? c.payer}</td>
                        <td className="py-1.5 pr-4 text-right font-semibold">{formatCopCents(c.amountCents)}</td>
                        <td className="py-1.5 pr-4">
                          {reversed ? 'Revertido' : 'Reconocido'}
                          {c.cause && <span className="block text-[11px]">{c.cause}</span>}
                        </td>
                        <td className="py-1.5 pr-4 font-mono text-[11px]">{c.sourceRef}</td>
                        <td className="whitespace-nowrap py-1.5">{formatColombiaDateTime(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Detalle ─────────────────────────────────────────────────────────────────

function Participant({
  icon: Icon,
  role,
  name,
  action,
}: {
  icon: React.ElementType;
  role: string;
  name: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
      <div className="rounded-xl bg-admin-blue/10 p-2.5">
        <Icon className="h-5 w-5 text-admin-midnight" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{role}</p>
        <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
      </div>
      {action}
    </div>
  );
}

export default function RecognitionDetail({ publicId }: { publicId: string }) {
  const queryClient = useQueryClient();
  const { data: recognition, isLoading, isError, error, refetch } = useAdminRecognition(publicId);
  const [cancelling, setCancelling] = useState(false);
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  const [copied, setCopied] = useState(false);

  const backLink = (
    <Link
      href="/admin/recognitions"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Reconocimientos
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (isError || !recognition) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        {backLink}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    );
  }

  const r = recognition;
  const productName = r.items[0]?.productName ?? '—';
  const quantity = r.items.length;
  const canCancel = canCancelRecognition(r);

  const copyFundingRef = () => {
    navigator.clipboard.writeText(r.fundingRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {backLink}

      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {productName}
              {quantity > 1 && <span className="text-gray-400"> × {quantity}</span>}
            </h1>
            <RecognitionStatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Reconocimiento para {r.beneficiaryName} · Compra #{r.purchaseId}
          </p>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50"
          >
            <Ban className="h-4 w-4" />
            Anular
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <InfoItem label="Creado">{formatColombiaDateTime(r.createdAt)}</InfoItem>
          <InfoItem label="Entregado">{r.deliveredAt ? formatColombiaDateTime(r.deliveredAt) : 'Aún no'}</InfoItem>
          <InfoItem label="Cerrado">{r.closedAt ? formatColombiaDateTime(r.closedAt) : '—'}</InfoItem>
          <InfoItem label="Creado por (admin)">
            <span className="font-mono text-xs font-normal text-gray-600">{r.createdByAdminPublicId}</span>
          </InfoItem>
        </dl>
        {r.cancelCause && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <Ban className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Causa de anulación:</strong> {r.cancelCause}
            </span>
          </p>
        )}
      </section>

      {/* ── Participantes ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Participantes</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Participant icon={ShoppingBag} role="Compradora" name="VERYGANA" />
          <Participant icon={Building2} role="Proveedor" name={r.commercialName ?? '—'} />
          <Participant
            icon={UserRound}
            role="Beneficiario"
            name={r.beneficiaryName}
            action={
              <button
                type="button"
                onClick={() => setShowBeneficiary(true)}
                title="Ver detalle del usuario"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-admin-blue transition-colors hover:bg-admin-blue/10"
              >
                Ver usuario
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Por qué se eligió ── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Por qué se eligió</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Criterio">{CRITERION_LABEL[r.criterion] ?? r.criterion}</InfoItem>
            <InfoItem label="Valor">{formatMetric(r.criterion, r.metricValue)}</InfoItem>
            <InfoItem label="Periodo">
              {r.periodFrom
                ? `${formatColombiaDate(r.periodFrom)} – ${formatColombiaDate(r.periodTo)}`
                : 'Acumulado (sin periodo)'}
            </InfoItem>
          </dl>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Motivo</p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.reason}</p>
          </div>
        </section>

        {/* ── Económico ── */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Económico</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: 'Total pagado por VERYGANA', cents: r.totalCents, strong: true },
              { label: 'Absorbido por Prosperidad', cents: r.prosperityAbsorbedCents },
              { label: 'Comisión', cents: r.commissionCents },
              { label: 'Neto al comercio', cents: r.netToCommercialCents, strong: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="text-gray-500">{row.label}</dt>
                <dd className={row.strong ? 'font-bold text-gray-900' : 'text-gray-900'}>{formatCopCents(row.cents)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
            <span className="text-[11px] text-gray-400">Ref. de financiación</span>
            <code className="min-w-0 flex-1 select-all truncate font-mono text-[11px] text-gray-600">{r.fundingRef}</code>
            <button
              type="button"
              onClick={copyFundingRef}
              aria-label="Copiar referencia de financiación"
              className="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </section>
      </div>

      {/* ── Ítems ── */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900">Ítems ({r.items.length})</h2>
          <p className="text-xs text-gray-500">Haz clic en un ítem para ver sus componentes de venta</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <Th>Producto</Th>
                <Th>Entrega</Th>
                <Th>Venta</Th>
                <Th align="right">Subtotal</Th>
                <Th align="right">Base comisionable</Th>
                <Th align="right">Comisión</Th>
                <Th align="right">Neto al comercio</Th>
                <Th>Fechas</Th>
                <Th>Vence el PIN</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {r.items.map((item) => (
                <ItemRow key={item.itemId} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {cancelling && (
        <CancelRecognitionModal
          recognition={r}
          onClose={() => setCancelling(false)}
          onCancelled={(updated) => {
            queryClient.setQueryData(recognitionKeys.detail(publicId), updated);
            // Refresca detalle, listado y saldo del fondo.
            queryClient.invalidateQueries({ queryKey: recognitionKeys.admin });
            queryClient.invalidateQueries({ queryKey: ['treasury', 'balance'] });
            setCancelling(false);
          }}
        />
      )}

      <UserDetailModal
        isOpen={showBeneficiary}
        role={Role.CONSUMER}
        publicId={r.beneficiaryPublicId}
        onClose={() => setShowBeneficiary(false)}
      />
    </div>
  );
}

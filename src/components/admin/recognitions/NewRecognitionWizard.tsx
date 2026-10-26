'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  PiggyBank,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CANDIDATES_PAGE_SIZE,
  recognitionKeys,
  useRecognitionCandidates,
  useRecognitionFund,
} from '@/hooks/recognitions/useRecognitions';
import { createRecognition } from '@/services/admin/AdminRecognitionService';
import { getAllProductsForAdmin } from '@/services/admin/AdminProductsService';
import { ProductStatus, type ProductSummaryResponseDTO } from '@/types/products/Product.types';
import type {
  CreateRecognitionRequest,
  RankingCriterion,
  RecognitionCandidate,
} from '@/types/recognitions/Recognition.types';
import { formatColombiaDate, formatCopCents } from '@/utils/keys';
import {
  CRITERION_LABEL,
  DEFAULT_PERIOD_DAYS,
  MAX_QUANTITY,
  MAX_REASON_LENGTH,
  MIN_QUANTITY,
  RANKING_CRITERIA,
  type RecognitionApiError,
  criterionUsesPeriod,
  dateInputDaysAgo,
  formatLocalDateTime,
  formatMetric,
  newIdempotencyKey,
  parseRecognitionError,
  pesosToCents,
  validatePeriod,
} from '@/utils/recognitions';
import { dateToZonedIsoEnd, dateToZonedIsoStart } from '@/lib/utils/dateTime';
import { levelLabel } from '@/components/admin/users/userMeta';
import { ProsperityPagination, Th } from '@/components/prosperity/ProsperityUI';
import { FieldError, inputClass } from '@/components/admin/prosperity/ProsperityModalShell';

// ─── Tipos locales ───────────────────────────────────────────────────────────

// Lo que se guarda al elegir una fila del ranking.
interface SelectedBeneficiary {
  candidate: RecognitionCandidate;
  criterion: RankingCriterion;
  metricValue: number;
  periodFrom: string | null;
  periodTo: string | null;
}

type Step = 1 | 2 | 3;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Beneficiario' },
  { step: 2, label: 'Producto' },
  { step: 3, label: 'Confirmar' },
];

// Campos del request -> paso donde se corrigen (errores 400 por campo).
const FIELD_STEP: Record<string, Step> = {
  beneficiaryPublicId: 1,
  criterion: 1,
  metricValue: 1,
  periodFrom: 1,
  periodTo: 1,
  productId: 2,
  quantity: 2,
  reason: 3,
};

const primaryButton =
  'inline-flex cursor-pointer items-center gap-2 rounded-xl bg-admin-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton =
  'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map(({ step, label }, i) => {
        const done = step < current;
        const active = step === current;
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-admin-midnight text-white'
                    : active
                      ? 'bg-admin-blue text-white ring-4 ring-admin-blue/20'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-gray-200 sm:w-12" />}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Paso 1: beneficiario ────────────────────────────────────────────────────

function BeneficiaryStep({
  selected,
  onSelect,
  fieldErrors,
}: {
  selected: SelectedBeneficiary | null;
  onSelect: (value: SelectedBeneficiary | null) => void;
  fieldErrors: Record<string, string>;
}) {
  const [criterion, setCriterion] = useState<RankingCriterion>(selected?.criterion ?? 'KEYS_EARNED');
  const [from, setFrom] = useState(dateInputDaysAgo(DEFAULT_PERIOD_DAYS));
  const [to, setTo] = useState(dateInputDaysAgo(0));
  const [page, setPage] = useState(0);

  const usesPeriod = criterionUsesPeriod(criterion);
  const periodError = usesPeriod ? validatePeriod(from, to) : null;
  const periodFrom = usesPeriod ? (dateToZonedIsoStart(from) ?? null) : null;
  const periodTo = usesPeriod ? (dateToZonedIsoEnd(to) ?? null) : null;

  const params = useMemo(
    () => ({
      criterion,
      from: periodFrom ?? undefined,
      to: periodTo ?? undefined,
      page,
      size: CANDIDATES_PAGE_SIZE,
    }),
    [criterion, periodFrom, periodTo, page],
  );
  const { data, isLoading, isError, error, isFetching } = useRecognitionCandidates(params, !periodError);
  const candidates = data?.data ?? [];

  // Cambiar criterio o periodo invalida la elección: el valor guardado debe
  // corresponder a lo que mostraba el ranking.
  const changeRanking = (fn: () => void) => {
    fn();
    setPage(0);
    onSelect(null);
  };

  const periodFieldError = fieldErrors.periodFrom || fieldErrors.periodTo;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Criterio</label>
          <select
            value={criterion}
            onChange={(e) => changeRanking(() => setCriterion(e.target.value as RankingCriterion))}
            className={`${inputClass(!!fieldErrors.criterion)} cursor-pointer bg-white`}
          >
            {RANKING_CRITERIA.map((c) => (
              <option key={c} value={c}>
                {CRITERION_LABEL[c]}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.criterion} />
        </div>
        {usesPeriod ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => changeRanking(() => setFrom(e.target.value))}
                className={inputClass(!!periodError || !!periodFieldError)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => changeRanking(() => setTo(e.target.value))}
                className={inputClass(!!periodError || !!periodFieldError)}
              />
            </div>
          </>
        ) : (
          <p className="self-end text-xs text-gray-500 md:col-span-2">
            El XP es acumulado: este ranking no usa periodo.
          </p>
        )}
      </div>
      {usesPeriod && <FieldError message={periodError ?? periodFieldError} />}
      <FieldError message={fieldErrors.beneficiaryPublicId || fieldErrors.metricValue} />

      <div className="overflow-hidden rounded-xl border border-gray-100">
        {periodError ? (
          <p className="py-10 text-center text-sm text-gray-400">Corrige el periodo para ver el ranking.</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : isError ? (
          <p className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {parseRecognitionError(error).message}
          </p>
        ) : candidates.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No hay candidatos para este criterio y periodo.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <Th className="w-10">#</Th>
                    <Th>Usuario</Th>
                    <Th align="right">{CRITERION_LABEL[criterion]}</Th>
                    <Th>Nivel</Th>
                    <Th>Última actividad</Th>
                    <Th>Reconocimientos recibidos</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {candidates.map((c, i) => {
                    const isSelected = selected?.candidate.publicId === c.publicId;
                    return (
                      <tr
                        key={c.publicId}
                        onClick={() =>
                          onSelect({ candidate: c, criterion, metricValue: c.metricValue, periodFrom, periodTo })
                        }
                        aria-selected={isSelected}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-admin-blue/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-gray-400">
                          {page * CANDIDATES_PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isSelected ? 'border-admin-blue bg-admin-blue' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </span>
                            <span className="font-semibold text-gray-900">{c.fullName}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900">
                          {formatMetric(criterion, c.metricValue)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{c.level ? levelLabel[c.level] : '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                          {formatLocalDateTime(c.lastActivityAt)}
                        </td>
                        <td className="px-4 py-3">
                          {c.recognitionsReceived > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              <History className="h-3.5 w-3.5" />
                              Ya recibió {c.recognitionsReceived}
                              {c.lastRecognitionAt && `, el último el ${formatColombiaDate(c.lastRecognitionAt)}`}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Ninguno</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data && <ProsperityPagination meta={data.meta} onPageChange={setPage} loading={isFetching} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Paso 2: producto ────────────────────────────────────────────────────────

const PRODUCTS_PAGE_SIZE = 8;

function ProductStep({
  product,
  quantity,
  onProduct,
  onQuantity,
  fortificationBalanceCents,
  fundLoading,
  fieldErrors,
}: {
  product: ProductSummaryResponseDTO | null;
  quantity: number;
  onProduct: (p: ProductSummaryResponseDTO) => void;
  onQuantity: (q: number) => void;
  fortificationBalanceCents: number | undefined;
  fundLoading: boolean;
  fieldErrors: Record<string, string>;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Mismo catálogo de productos del admin que usan las promociones de llaves:
  // solo productos activos.
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'products', 'recognition-picker', search, page],
    queryFn: () => getAllProductsForAdmin(ProductStatus.ACTIVE, search || undefined, page, PRODUCTS_PAGE_SIZE),
    staleTime: 30_000,
  });
  const products = data?.data ?? [];

  const maxQuantity = product ? Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, product.stock)) : MAX_QUANTITY;
  const unitCents = product ? pesosToCents(product.price) : 0;
  const totalCents = unitCents * quantity;
  const insufficient = product != null && fortificationBalanceCents != null && totalCents > fortificationBalanceCents;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar producto por nombre"
            className={`${inputClass(false)} pl-9`}
          />
        </div>
        <FieldError message={fieldErrors.productId} />

        <div className="overflow-hidden rounded-xl border border-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-red-600">No se pudieron cargar los productos.</p>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No hay productos activos que coincidan.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {products.map((p) => {
                  const noStock = p.stock <= 0;
                  const isSelected = product?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={noStock}
                        onClick={() => onProduct(p)}
                        className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                          isSelected ? 'bg-admin-blue/10' : 'hover:bg-gray-50'
                        } ${noStock ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-11 w-11 shrink-0 rounded-lg border border-gray-100 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {p.companyName} · {noStock ? 'Sin stock' : `${p.stock} en stock`}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-900">
                          {formatCopCents(pesosToCents(p.price))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {data && (
                <ProsperityPagination meta={data.meta} onPageChange={setPage} loading={isFetching} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Resumen de costo ── */}
      <aside className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          {product ? (
            <>
              <p className="text-xs text-gray-500">Producto seleccionado</p>
              <p className="mt-0.5 font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500">{product.companyName}</p>

              <label className="mb-1 mt-4 block text-xs font-medium text-gray-600">
                Cantidad ({MIN_QUANTITY} a {maxQuantity})
              </label>
              <input
                type="number"
                min={MIN_QUANTITY}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const n = Math.floor(Number(e.target.value));
                  onQuantity(Number.isFinite(n) ? Math.min(maxQuantity, Math.max(MIN_QUANTITY, n)) : MIN_QUANTITY);
                }}
                className={`${inputClass(!!fieldErrors.quantity)} w-28`}
              />
              <FieldError message={fieldErrors.quantity} />

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Precio unitario</dt>
                  <dd className="text-gray-900">{formatCopCents(unitCents)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Cantidad</dt>
                  <dd className="text-gray-900">× {quantity}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-gray-200 pt-1.5">
                  <dt className="font-semibold text-gray-900">Total con cargo al fondo</dt>
                  <dd className="font-bold text-gray-900">{formatCopCents(totalCents)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-gray-400">Elige un producto de la lista.</p>
          )}
        </div>

        <FundCoverage
          totalCents={product ? totalCents : null}
          balanceCents={fortificationBalanceCents}
          loading={fundLoading}
          insufficient={insufficient}
        />
      </aside>
    </div>
  );
}

function FundCoverage({
  totalCents,
  balanceCents,
  loading,
  insufficient,
}: {
  totalCents: number | null;
  balanceCents: number | undefined;
  loading: boolean;
  insufficient: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${
        insufficient ? 'border-red-200 bg-red-50 text-red-800' : 'border-admin-blue/20 bg-admin-blue/5 text-gray-700'
      }`}
    >
      <p className="flex items-center gap-2 text-xs font-medium">
        <PiggyBank className={`h-4 w-4 ${insufficient ? 'text-red-600' : 'text-admin-midnight'}`} />
        Saldo del Fondo de Fortalecimiento
      </p>
      <p className="mt-1 text-lg font-bold">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-300" /> : formatCopCents(balanceCents)}
      </p>
      {insufficient ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          El fondo no alcanza para {formatCopCents(totalCents)}. No hay financiación parcial: el fondo debe cubrir el
          100 % del reconocimiento. Elige otro producto o una cantidad menor.
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">El fondo debe cubrir el 100 % del total.</p>
      )}
    </div>
  );
}

// ─── Paso 3: confirmar ───────────────────────────────────────────────────────

function SummaryRow({
  label,
  children,
  error,
  onEdit,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-right">
        <div className="text-sm font-semibold text-gray-900">{children}</div>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
        {error && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-0.5 cursor-pointer text-xs font-semibold text-admin-blue hover:underline"
          >
            Corregir
          </button>
        )}
      </dd>
    </div>
  );
}

// ─── Asistente ───────────────────────────────────────────────────────────────

export default function NewRecognitionWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fund = useRecognitionFund();

  const [step, setStep] = useState<Step>(1);
  const [beneficiary, setBeneficiary] = useState<SelectedBeneficiary | null>(null);
  const [product, setProduct] = useState<ProductSummaryResponseDTO | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [serverError, setServerError] = useState<RecognitionApiError | null>(null);

  // Idempotency-Key: se genera UNA vez al abrir el asistente y se reutiliza en
  // cada reintento (doble clic, timeout, red). Solo se rota si el envío
  // anterior fue rechazado de forma definitiva (4xx) y el admin cambió los
  // datos: entonces es un reconocimiento distinto.
  const attemptRef = useRef<{ key: string; fingerprint: string | null; rejected: boolean }>({
    key: '',
    fingerprint: null,
    rejected: false,
  });
  if (!attemptRef.current.key) attemptRef.current.key = newIdempotencyKey();
  const submittingRef = useRef(false);

  const totalCents = product ? pesosToCents(product.price) * quantity : 0;
  const balance = fund.data?.fortificationBalanceCents;
  const insufficient = product != null && balance != null && totalCents > balance;
  const trimmedReason = reason.trim();
  const reasonError =
    trimmedReason.length === 0
      ? 'El motivo es obligatorio.'
      : trimmedReason.length > MAX_REASON_LENGTH
        ? `Máximo ${MAX_REASON_LENGTH} caracteres.`
        : null;

  const fieldErrors = serverError?.fieldErrors ?? {};

  const mutation = useMutation({
    mutationFn: ({ request, key }: { request: CreateRecognitionRequest; key: string }) =>
      createRecognition(request, key),
    onSuccess: (detail) => {
      queryClient.setQueryData(recognitionKeys.detail(detail.publicId), detail);
      queryClient.invalidateQueries({ queryKey: recognitionKeys.admin });
      queryClient.invalidateQueries({ queryKey: ['treasury', 'balance'] });
      toast.success(`Reconocimiento creado para ${detail.beneficiaryName}`);
      router.replace(`/admin/recognitions/${detail.publicId}`);
    },
    onError: (err) => {
      const parsed = parseRecognitionError(err);
      attemptRef.current.rejected = parsed.definitive;
      setServerError(parsed);
      // El saldo cambió desde que se cargó: refrescarlo para que el paso 2
      // compare contra el valor real.
      if (parsed.kind === 'FUND') queryClient.invalidateQueries({ queryKey: recognitionKeys.fund });
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const handleSubmit = () => {
    setReasonTouched(true);
    if (!beneficiary || !product || reasonError || insufficient) return;
    // Bloqueo síncrono contra doble clic (antes de que React re-renderice).
    if (submittingRef.current || mutation.isPending) return;
    submittingRef.current = true;

    const request: CreateRecognitionRequest = {
      beneficiaryPublicId: beneficiary.candidate.publicId,
      productId: product.id,
      quantity,
      criterion: beneficiary.criterion,
      metricValue: beneficiary.metricValue,
      periodFrom: beneficiary.periodFrom,
      periodTo: beneficiary.periodTo,
      reason: trimmedReason,
    };

    const fingerprint = JSON.stringify(request);
    const attempt = attemptRef.current;
    if (attempt.fingerprint !== null && attempt.fingerprint !== fingerprint && attempt.rejected) {
      attempt.key = newIdempotencyKey();
    }
    attempt.fingerprint = fingerprint;
    attempt.rejected = false;

    setServerError(null);
    mutation.mutate({ request, key: attempt.key });
  };

  const goTo = (target: Step) => {
    if (!mutation.isPending) setStep(target);
  };

  const canContinue = step === 1 ? beneficiary != null : step === 2 ? product != null && !insufficient : false;
  const sending = mutation.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Link
        href="/admin/recognitions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Reconocimientos
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo reconocimiento</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">
            VERYGANA compra el producto con el Fondo de Fortalecimiento y se lo otorga al beneficiario, que no paga
            dinero ni llaves. Para el empresario es una venta normal.
          </p>
        </div>
        <Stepper current={step} />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Pasos 1 y 2 quedan montados (ocultos) para conservar filtros y página al volver. */}
        <div className={step === 1 ? '' : 'hidden'}>
          <h2 className="mb-1 text-base font-semibold text-gray-900">1. Elige al beneficiario</h2>
          <p className="mb-5 text-xs text-gray-500">
            Revisa los reconocimientos que ya recibió cada usuario para no premiar siempre a los mismos.
          </p>
          <BeneficiaryStep selected={beneficiary} onSelect={setBeneficiary} fieldErrors={fieldErrors} />
        </div>

        {step >= 2 && (
          <div className={step === 2 ? '' : 'hidden'}>
            <h2 className="mb-1 text-base font-semibold text-gray-900">2. Elige el producto</h2>
            <p className="mb-5 text-xs text-gray-500">Solo productos activos con stock disponible.</p>
            <ProductStep
              product={product}
              quantity={quantity}
              onProduct={(p) => {
                setProduct(p);
                setQuantity((q) => Math.max(MIN_QUANTITY, Math.min(q, MAX_QUANTITY, p.stock)));
              }}
              onQuantity={setQuantity}
              fortificationBalanceCents={balance}
              fundLoading={fund.isLoading}
              fieldErrors={fieldErrors}
            />
          </div>
        )}

        {step === 3 && beneficiary && product && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 className="mb-3 text-base font-semibold text-gray-900">3. Confirma el reconocimiento</h2>
              <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
                <SummaryRow
                  label="Beneficiario"
                  error={fieldErrors.beneficiaryPublicId}
                  onEdit={() => goTo(FIELD_STEP.beneficiaryPublicId)}
                >
                  {beneficiary.candidate.fullName}
                </SummaryRow>
                <SummaryRow label="Producto" error={fieldErrors.productId} onEdit={() => goTo(2)}>
                  {product.name}
                  <span className="block text-xs font-normal text-gray-500">{product.companyName}</span>
                </SummaryRow>
                <SummaryRow label="Cantidad" error={fieldErrors.quantity} onEdit={() => goTo(2)}>
                  {quantity}
                </SummaryRow>
                <SummaryRow label="Total con cargo al fondo">{formatCopCents(totalCents)}</SummaryRow>
                <SummaryRow
                  label="Criterio"
                  error={fieldErrors.criterion || fieldErrors.metricValue}
                  onEdit={() => goTo(1)}
                >
                  {CRITERION_LABEL[beneficiary.criterion]}: {formatMetric(beneficiary.criterion, beneficiary.metricValue)}
                </SummaryRow>
                <SummaryRow
                  label="Periodo"
                  error={fieldErrors.periodFrom || fieldErrors.periodTo}
                  onEdit={() => goTo(1)}
                >
                  {beneficiary.periodFrom
                    ? `${formatColombiaDate(beneficiary.periodFrom)} – ${formatColombiaDate(beneficiary.periodTo)}`
                    : 'Acumulado (sin periodo)'}
                </SummaryRow>
              </dl>

              <div className="mt-5">
                <label htmlFor="recognition-reason" className="mb-1 block text-sm font-medium text-gray-700">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="recognition-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onBlur={() => setReasonTouched(true)}
                  maxLength={MAX_REASON_LENGTH}
                  rows={4}
                  disabled={sending}
                  placeholder="Ej.: Usuario con más llaves ganadas en septiembre."
                  className={inputClass(!!fieldErrors.reason || (reasonTouched && !!reasonError))}
                />
                <div className="flex justify-between gap-2">
                  <FieldError message={fieldErrors.reason || (reasonTouched ? (reasonError ?? undefined) : undefined)} />
                  <span className="ml-auto mt-1 text-xs text-gray-400">
                    {reason.length}/{MAX_REASON_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <aside className="space-y-4 lg:col-span-2">
              <FundCoverage
                totalCents={totalCents}
                balanceCents={balance}
                loading={fund.isLoading}
                insufficient={insufficient}
              />
              <p className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-xs leading-relaxed text-gray-600">
                La compradora es <strong>VERYGANA</strong>. El beneficiario recibe el producto sin pagar dinero ni
                llaves y se le notificará que VERYGANA le otorgó un reconocimiento.
              </p>
            </aside>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError.message}</span>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (step === 1 ? router.push('/admin/recognitions') : goTo((step - 1) as Step))}
          disabled={sending}
          className={secondaryButton}
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        {step < 3 ? (
          <button type="button" onClick={() => goTo((step + 1) as Step)} disabled={!canContinue} className={primaryButton}>
            Continuar
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || insufficient || fund.isLoading || !!reasonError}
            title={insufficient ? 'El fondo debe cubrir el 100 % del reconocimiento' : undefined}
            className={primaryButton}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {sending ? 'Creando…' : 'Confirmar reconocimiento'}
          </button>
        )}
      </div>
    </div>
  );
}

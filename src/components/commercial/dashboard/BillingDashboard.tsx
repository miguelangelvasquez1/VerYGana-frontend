'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingDown, TrendingUp, Crown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getBillingSummary, getDeposits, getPayouts } from '@/services/WalletService';
import {
  BillingSummaryResponseDTO,
  DepositResponseDTO,
  PayoutSummaryResponseDTO,
  WalletStatus,
  PayoutStatus,
  DepositType,
} from '@/types/finance/Wallet.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { PagedResponse } from '@/types/Generic.types';

const formatCents = (cents: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(cents / 100);

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

const walletStatusLabels: Record<WalletStatus, string> = {
  [WalletStatus.INACTIVE]: 'Inactiva',
  [WalletStatus.ACTIVE]: 'Activa',
  [WalletStatus.LOW_BALANCE]: 'Saldo Bajo',
  [WalletStatus.EXHAUSTED]: 'Agotada',
};

const walletStatusColors: Record<WalletStatus, string> = {
  [WalletStatus.INACTIVE]: 'bg-gray-100 text-gray-700',
  [WalletStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [WalletStatus.LOW_BALANCE]: 'bg-yellow-100 text-yellow-700',
  [WalletStatus.EXHAUSTED]: 'bg-red-100 text-red-700',
};

const payoutStatusLabels: Record<PayoutStatus, string> = {
  [PayoutStatus.PROCESSING]: 'Procesando',
  [PayoutStatus.SCHEDULED]: 'Programado',
  [PayoutStatus.PAID]: 'Pagado',
  [PayoutStatus.FAILED]: 'Fallido',
};

const payoutStatusColors: Record<PayoutStatus, string> = {
  [PayoutStatus.PROCESSING]: 'bg-blue-100 text-blue-700',
  [PayoutStatus.SCHEDULED]: 'bg-yellow-100 text-yellow-700',
  [PayoutStatus.PAID]: 'bg-green-100 text-green-700',
  [PayoutStatus.FAILED]: 'bg-red-100 text-red-700',
};

const depositTypeLabels: Record<DepositType, string> = {
  [DepositType.SUBSCRIPTION]: 'Suscripción',
  [DepositType.INVESTMENT]: 'Inversión',
};

const planCodeLabels: Record<PlanCode, string> = {
  [PlanCode.BASIC]: 'Básico',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]: 'Premium',
};

interface FiltersState {
  year: number;
  month: number;
  page: number;
}

const makeDefaultFilters = (): FiltersState => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, page: 0 };
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor: string;
  subtitle?: string;
  badge?: React.ReactNode;
  loading: boolean;
  error: boolean;
}

function SummaryCard({ title, value, icon, iconBg, valueColor, subtitle, badge, loading, error }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          {loading ? (
            <div className="mt-1.5 h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
          ) : error ? (
            <p className="mt-1 text-sm text-red-500">Error al cargar</p>
          ) : (
            <p className={`mt-1 text-2xl font-bold truncate ${valueColor}`}>{value}</p>
          )}
          {!loading && !error && (badge || subtitle) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {badge}
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

function YearMonthFilter({ filters, onChange }: { filters: FiltersState; onChange: (f: FiltersState) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
      <select
        value={filters.year}
        onChange={(e) => onChange({ ...filters, year: Number(e.target.value), page: 0 })}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={filters.month}
        onChange={(e) => onChange({ ...filters, month: Number(e.target.value), page: 0 })}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
    </div>
  );
}

type Meta = PagedResponse<unknown>['meta'];

function Pagination({ meta, page, onPageChange }: { meta: Meta; page: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {meta.totalElements} registros · Página {meta.page + 1} de {Math.max(meta.totalPages, 1)}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevious}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-5 flex-1 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="py-8 text-center space-y-2">
      <p className="text-sm text-red-500">Error al cargar los datos.</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-blue-600 hover:underline">
          Reintentar
        </button>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function BillingDashboard() {
  const [summary, setSummary] = useState<BillingSummaryResponseDTO | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [depositFilters, setDepositFilters] = useState<FiltersState>(makeDefaultFilters);
  const [depositsData, setDepositsData] = useState<PagedResponse<DepositResponseDTO> | null>(null);
  const [depositsLoading, setDepositsLoading] = useState(true);
  const [depositsError, setDepositsError] = useState(false);

  const [payoutFilters, setPayoutFilters] = useState<FiltersState>(makeDefaultFilters);
  const [payoutsData, setPayoutsData] = useState<PagedResponse<PayoutSummaryResponseDTO> | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState(false);

  const loadSummary = () => {
    setSummaryLoading(true);
    setSummaryError(false);
    getBillingSummary()
      .then(setSummary)
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false));
  };

  const loadDeposits = (filters: FiltersState) => {
    setDepositsLoading(true);
    setDepositsError(false);
    getDeposits(filters.year, filters.month, 10, filters.page)
      .then(setDepositsData)
      .catch(() => setDepositsError(true))
      .finally(() => setDepositsLoading(false));
  };

  const loadPayouts = (filters: FiltersState) => {
    setPayoutsLoading(true);
    setPayoutsError(false);
    getPayouts(filters.year, filters.month, 10, filters.page)
      .then(setPayoutsData)
      .catch(() => setPayoutsError(true))
      .finally(() => setPayoutsLoading(false));
  };

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadDeposits(depositFilters); }, [depositFilters]);
  useEffect(() => { loadPayouts(payoutFilters); }, [payoutFilters]);

  return (
    <div className="space-y-6">

      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Saldo Actual"
          value={summary?.balanceCents != null ? formatCents(summary.balanceCents) : '—'}
          icon={<Wallet className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          valueColor="text-green-600"
          badge={
            summary?.walletStatus != null ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${walletStatusColors[summary.walletStatus]}`}>
                {walletStatusLabels[summary.walletStatus]}
              </span>
            ) : undefined
          }
          loading={summaryLoading}
          error={summaryError}
        />

        <SummaryCard
          title="Gastado Este Mes"
          value={summary?.spentThisMonthCents != null ? formatCents(summary.spentThisMonthCents) : '—'}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-50"
          valueColor="text-red-600"
          loading={summaryLoading}
          error={summaryError}
        />

        <SummaryCard
          title="Ganado Este Mes"
          value={summary ? formatCents(summary.earnedThisMonthCents) : '—'}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          valueColor="text-blue-600"
          loading={summaryLoading}
          error={summaryError}
        />

        <SummaryCard
          title="Plan Actual"
          value={summary ? planCodeLabels[summary.currentPlan.planCode] : '—'}
          icon={<Crown className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
          valueColor="text-purple-700"
          subtitle={
            summary?.currentPlan.daysRemaining != null
              ? `${summary.currentPlan.daysRemaining} días restantes`
              : summary?.currentPlan.endDate
              ? `Vence: ${new Date(summary.currentPlan.endDate).toLocaleDateString('es-CO')}`
              : undefined
          }
          loading={summaryLoading}
          error={summaryError}
        />
      </div>

      {/* ── Tabla de depósitos ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Depósitos</h3>
          <YearMonthFilter filters={depositFilters} onChange={setDepositFilters} />
        </div>

        {depositsLoading ? (
          <TableSkeleton cols={6} rows={5} />
        ) : depositsError ? (
          <ErrorMessage onRetry={() => loadDeposits(depositFilters)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Referencia</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Monto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {!depositsData?.data?.length ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                        No hay depósitos para el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    (depositsData.data ?? []).map((d, i) => (
                      <tr
                        key={`${d.referenceId}-${i}`}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {depositTypeLabels[d.type]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{d.description}</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-400">{d.referenceId}</td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {new Date(d.date).toLocaleDateString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600 whitespace-nowrap">
                          +{formatCents(d.amountCents)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${walletStatusColors[d.status]}`}>
                            {walletStatusLabels[d.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(depositsData?.meta?.totalPages ?? 0) > 1 && (
              <Pagination
                meta={depositsData!.meta}
                page={depositFilters.page}
                onPageChange={(p) => setDepositFilters((f) => ({ ...f, page: p }))}
              />
            )}
          </>
        )}
      </div>

      {/* ── Tabla de payouts ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Pagos (Payouts)</h3>
          <YearMonthFilter filters={payoutFilters} onChange={setPayoutFilters} />
        </div>

        {payoutsLoading ? (
          <TableSkeleton cols={7} rows={5} />
        ) : payoutsError ? (
          <ErrorMessage onRetry={() => loadPayouts(payoutFilters)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Monto Bruto</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Comisión</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Monto Neto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Programado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Pagado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {!payoutsData?.data?.length ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                        No hay pagos para el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    (payoutsData.data ?? []).map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-400 max-w-32 truncate">{p.id}</td>
                        <td className="py-3 px-4 text-right text-gray-700 whitespace-nowrap">
                          {formatCents(p.grossAmountCents)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-500 whitespace-nowrap">
                          -{formatCents(p.commissionCents)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600 whitespace-nowrap">
                          {formatCents(p.netAmountCents)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payoutStatusColors[p.status]}`}>
                            {payoutStatusLabels[p.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(payoutsData?.meta?.totalPages ?? 0) > 1 && (
              <Pagination
                meta={payoutsData!.meta}
                page={payoutFilters.page}
                onPageChange={(p) => setPayoutFilters((f) => ({ ...f, page: p }))}
              />
            )}
          </>
        )}
      </div>

    </div>
  );
}

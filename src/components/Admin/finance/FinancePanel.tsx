'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Zap,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Activity,
  ChevronRight,
  Wallet,
  Eye,
} from 'lucide-react';
import { getBalance, getMovements } from '@/services/TreasuryService';
import { TreasuryMovementResponseDTO } from '@/types/finance/Treasury.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (cents: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getHealthGradient = (pct: number): string => {
  if (pct >= 80) return 'from-green-400 to-green-500';
  if (pct >= 50) return 'from-yellow-400 to-yellow-500';
  if (pct >= 25) return 'from-orange-400 to-orange-500';
  return 'from-red-400 to-red-500';
};

const getHealthDescription = (pct: number): string => {
  if (pct >= 80) return 'La reserva está en excelente estado. Capacidad de respaldo óptima para el sistema.';
  if (pct >= 50) return 'La reserva está en buen estado. Se recomienda monitoreo periódico.';
  if (pct >= 25) return 'La reserva necesita atención. Considera reponer fondos en el corto plazo.';
  return 'Reserva en estado crítico. Se requiere acción inmediata para garantizar la operación.';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { code: 'KEYS_RESERVE',    label: 'Reserva de Llaves', icon: Shield,   color: 'blue'   },
  { code: 'FORTIFICATION',   label: 'Fortalecimiento',   icon: Zap,      color: 'purple' },
  { code: 'OPERATIONS',      label: 'Operaciones',        icon: Activity, color: 'green'  },
  { code: 'PAYOUTS_PENDING', label: 'Pagos Pendientes',  icon: Clock,    color: 'orange' },
] as const;

const REF_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  RAFFLE:   { label: 'Rifa',     color: 'bg-purple-100 text-purple-700' },
  PAYOUT:   { label: 'Pago',     color: 'bg-orange-100 text-orange-700' },
  DEPOSIT:  { label: 'Depósito', color: 'bg-green-100 text-green-700'   },
  FEE:      { label: 'Comisión', color: 'bg-blue-100 text-blue-700'     },
  TRANSFER: { label: 'Transfer', color: 'bg-gray-100 text-gray-700'     },
};

const COLOR_MAP: Record<string, {
  bg: string; icon: string; badge: string; border: string;
  light: string; ring: string; bar: string;
}> = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    badge: 'bg-blue-600',   border: 'border-blue-200',   light: 'text-blue-600',   ring: 'ring-blue-300',   bar: 'bg-blue-500'   },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-600', border: 'border-purple-200', light: 'text-purple-600', ring: 'ring-purple-300', bar: 'bg-purple-500' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',   badge: 'bg-green-600',  border: 'border-green-200',  light: 'text-green-600',  ring: 'ring-green-300',  bar: 'bg-green-500'  },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-600', border: 'border-orange-200', light: 'text-orange-600', ring: 'ring-orange-300', bar: 'bg-orange-400' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

function HealthBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; classes: string }> = {
    HEALTHY:   { label: 'Saludable',   classes: 'bg-green-100 text-green-700 border-green-200'    },
    WARNING:   { label: 'Advertencia', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    CRITICAL:  { label: 'Crítico',     classes: 'bg-red-100 text-red-700 border-red-200'          },
    DEFICIENT: { label: 'Deficiente',  classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const cfg = configs[status] ?? {
    label: status || 'Desconocido',
    classes: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function MovementRow({
  movement,
  selectedCode,
}: {
  movement: TreasuryMovementResponseDTO;
  selectedCode: string;
}) {
  const isIncoming = movement.toAccountCode === selectedCode;
  const refType = REF_TYPE_LABELS[movement.referenceType] ?? {
    label: movement.referenceType,
    color: 'bg-gray-100 text-gray-700',
  };
  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
        {formatDate(movement.createdAt)}
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-medium text-gray-900">{movement.concept}</span>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-mono text-gray-600">
            {movement.fromAccountCode}
          </span>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-mono text-gray-600">
            {movement.toAccountCode}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${refType.color}`}>
          {refType.label}
        </span>
      </td>
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-gray-400 font-mono">
          {movement.referenceId.length > 12
            ? `${movement.referenceId.slice(0, 12)}…`
            : movement.referenceId}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <span className={`text-sm font-bold ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
          {isIncoming ? '+' : '-'}{formatCOP(movement.amountCents)}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TreasuryPanel() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['treasury', 'balance'],
    queryFn: getBalance,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const {
    data: movements,
    isLoading: movementsLoading,
    isError: movementsError,
  } = useQuery({
    queryKey: ['treasury', 'movements', selectedAccount],
    queryFn: () => getMovements(selectedAccount!),
    enabled: !!selectedAccount,
    staleTime: 15_000,
  });

  const total = balance?.totalCents ?? 0;

  const accountData = [
    {
      code: 'KEYS_RESERVE',
      label: 'Reserva de Llaves',
      icon: Shield,
      color: 'blue',
      value: balance?.keysReserveCents ?? 0,
      description: 'Fondos de respaldo del sistema de llaves',
    },
    {
      code: 'FORTIFICATION',
      label: 'Fortalecimiento',
      icon: Zap,
      color: 'purple',
      value: balance?.fortificationCents ?? 0,
      description: 'Inversión en crecimiento y mejoras',
    },
    {
      code: 'OPERATIONS',
      label: 'Operaciones',
      icon: Activity,
      color: 'green',
      value: balance?.operationsCents ?? 0,
      description: 'Capital operativo y gastos corrientes',
    },
    {
      code: 'PAYOUTS_PENDING',
      label: 'Pagos Pendientes',
      icon: Clock,
      color: 'orange',
      value: balance?.payoutsPendingCents ?? 0,
      description: 'Pagos a ganadores pendientes de entrega',
    },
  ];

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Tesorería</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visión general de cuentas, balances y movimientos
            {lastUpdated && (
              <span className="ml-2 text-gray-400">· Actualizado a las {lastUpdated}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetchBalance()}
          disabled={balanceLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* ── Negative balance alert ── */}
      {balance?.hasNegativeBalance && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Alerta: Balance negativo detectado</p>
            <p className="text-xs text-red-600 mt-0.5">
              Una o más cuentas tienen saldo negativo. Revise los movimientos para identificar el origen del déficit.
            </p>
          </div>
        </div>
      )}

      {/* ── Balance error ── */}
      {balanceError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No se pudo cargar el balance de tesorería. Intenta actualizar.
        </div>
      )}

      {/* ── Hero: Total balance ── */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">
              Balance Total del Tesoro
            </p>
            {balanceLoading ? (
              <div className="h-12 w-56 bg-white/20 rounded-xl animate-pulse mt-2" />
            ) : (
              <p className="text-4xl font-bold mt-1 tracking-tight">{formatCOP(total)}</p>
            )}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {balance?.hasNegativeBalance ? (
                <span className="flex items-center gap-1.5 text-xs bg-red-500/30 border border-red-400/50 text-red-100 px-3 py-1.5 rounded-full font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  Balance negativo
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-white/20 border border-white/30 text-white px-3 py-1.5 rounded-full font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Estado saludable
                </span>
              )}
              {balance && (
                <span className="flex items-center gap-1.5 text-xs bg-white/15 border border-white/25 text-blue-100 px-3 py-1.5 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  Salud reserva: {balance.keysReserveHealthPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="p-5 bg-white/15 rounded-2xl">
            <Wallet className="w-14 h-14 text-white" />
          </div>
        </div>
      </div>

      {/* ── Account cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountData.map(({ code, label, icon: Icon, color, value, description }) => {
          const c = COLOR_MAP[color];
          const isSelected = selectedAccount === code;
          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return (
            <button
              key={code}
              onClick={() => setSelectedAccount(isSelected ? null : code)}
              className={`text-left w-full p-5 rounded-2xl border-2 transition-all shadow-sm ${
                isSelected
                  ? `${c.border} ${c.bg} shadow-md ring-2 ring-offset-1 ${c.ring}`
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`p-2.5 rounded-xl ${c.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? `${c.badge} text-white` : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-4">{label}</p>
              {balanceLoading ? (
                <SkeletonBox className="h-7 w-36 mt-1" />
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
                  {formatCOP(value)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{description}</p>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${c.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(Number(pct), 100)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Distribution bar ── */}
      {balance && !balanceLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Distribución de Fondos</h3>
          <p className="text-xs text-gray-500 mb-4">
            Participación porcentual de cada cuenta en el balance total
          </p>
          <div className="flex w-full h-4 rounded-full overflow-hidden gap-0.5">
            {accountData.map(({ code, color, value }) => {
              const c = COLOR_MAP[color];
              const width = total > 0 ? (value / total) * 100 : 0;
              if (width <= 0) return null;
              return (
                <div
                  key={code}
                  className={`h-full ${c.bar} transition-all duration-700`}
                  style={{ width: `${width}%` }}
                  title={`${ACCOUNTS.find((a) => a.code === code)?.label}: ${formatCOP(value)}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {accountData.map(({ code, label, color, value }) => {
              const c = COLOR_MAP[color];
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={code} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
                  <span className="text-xs text-gray-600 font-medium">{label}</span>
                  <span className="text-xs text-gray-400">{pct}%</span>
                  <span className="text-xs font-semibold text-gray-600">{formatCOP(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Keys Reserve Health ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Salud de la Reserva de Llaves
              </h3>
              <p className="text-xs text-gray-500">
                Indicador de capacidad de respaldo del sistema
              </p>
            </div>
          </div>
          {balanceLoading ? (
            <SkeletonBox className="h-7 w-28" />
          ) : (
            <HealthBadge status={balance?.keysReserveStatus ?? ''} />
          )}
        </div>

        {balanceLoading ? (
          <div className="space-y-2">
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-4 w-64 mt-3" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>0%</span>
              <span className="text-base font-bold text-gray-700">
                {(balance?.keysReserveHealthPct ?? 0).toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-gradient-to-r transition-all duration-700 ${getHealthGradient(
                  balance?.keysReserveHealthPct ?? 0
                )}`}
                style={{ width: `${Math.min(balance?.keysReserveHealthPct ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              {getHealthDescription(balance?.keysReserveHealthPct ?? 0)}
            </p>
          </>
        )}
      </div>

      {/* ── Movements section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <ArrowRightLeft className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Movimientos de Cuenta</h3>
              <p className="text-xs text-gray-500">
                {selectedAccount
                  ? `Historial de ${ACCOUNTS.find((a) => a.code === selectedAccount)?.label}`
                  : 'Selecciona una cuenta para ver su historial de transacciones'}
              </p>
            </div>
          </div>
          <select
            value={selectedAccount ?? ''}
            onChange={(e) => setSelectedAccount(e.target.value || null)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-gray-700"
          >
            <option value="">Seleccionar cuenta...</option>
            {ACCOUNTS.map((a) => (
              <option key={a.code} value={a.code}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* No account selected */}
        {!selectedAccount && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Eye className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Ninguna cuenta seleccionada</p>
            <p className="text-xs text-gray-400 mt-1">
              Selecciona una cuenta en el desplegable o haz clic en una tarjeta de balance
            </p>
          </div>
        )}

        {/* Loading movements */}
        {selectedAccount && movementsLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3} />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
            </svg>
            <span className="text-sm">Cargando movimientos...</span>
          </div>
        )}

        {/* Movements error */}
        {selectedAccount && movementsError && (
          <div className="flex items-center gap-3 m-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            No se pudieron cargar los movimientos de esta cuenta.
          </div>
        )}

        {/* Empty */}
        {selectedAccount && !movementsLoading && !movementsError && movements?.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <ArrowRightLeft className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Sin movimientos registrados</p>
            <p className="text-xs text-gray-400 mt-1">
              Esta cuenta no tiene transacciones registradas aún
            </p>
          </div>
        )}

        {/* Table */}
        {selectedAccount && !movementsLoading && movements && movements.data.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Concepto
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell whitespace-nowrap">
                      Origen → Destino
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Tipo
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                      Referencia
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.data.map((m) => (
                    <MovementRow key={m.id} movement={m} selectedCode={selectedAccount} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400">
                {movements.data.length} movimiento{movements.data.length !== 1 ? 's' : ''} encontrado
                {movements.data.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

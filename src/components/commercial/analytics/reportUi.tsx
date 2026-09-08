'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DateRangeFilter } from './analytics.types';
import type { DayCount } from '@/services/commercial/analyticsReportService';
import { formatInt, pctForBar, shortDay } from './reportFormat';

// ─── Encabezado de sección ───────────────────────────────────────────────────

export function ReportSectionHeader({
  title,
  subtitle,
  dateRange,
}: {
  title: string;
  subtitle?: string;
  dateRange: DateRangeFilter;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({dateRange.startDate} — {dateRange.endDate})
        </span>
      </h3>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

// ─── Estados de carga / error / vacío ────────────────────────────────────────

export function ReportLoading({ label = 'Cargando datos…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#03548C] border-t-transparent" />
      {label}
    </div>
  );
}

export function ReportError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm text-red-700">
      {message}
    </div>
  );
}

export function ReportEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

// ─── Barra de progreso ───────────────────────────────────────────────────────

export function ProgressBar({
  pct,
  className = '',
}: {
  pct: number | null | undefined;
  className?: string;
}) {
  const width = pctForBar(pct);
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <div
        className="h-full rounded-full bg-[#03548C] transition-[width]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Gráfica de serie diaria ─────────────────────────────────────────────────

interface DailySeriesChartProps {
  title: string;
  data: DayCount[];
  /** "area" (por defecto) o "bar" */
  variant?: 'area' | 'bar';
  emptyLabel?: string;
  /** etiqueta del valor en el tooltip */
  valuelabel?: string;
}

/**
 * Las series *ByDay del backend siempre cubren todo el rango con ceros, así que
 * se pueden graficar directo. Si todos los días son 0 se muestra un texto en
 * vez de una gráfica plana.
 */
export function DailySeriesChart({
  title,
  data,
  variant = 'area',
  emptyLabel = 'Sin actividad en este período.',
  valuelabel = 'Total',
}: DailySeriesChartProps) {
  const chartData = data.map((d) => ({ dia: shortDay(d.date), valor: d.count }));
  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {hasData ? (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            {variant === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(v) => formatInt(Number(v))}
                  labelFormatter={(l) => `${valuelabel} · ${l}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Bar dataKey="valor" fill="#03548C" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="analyticsSeriesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#03548C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#03548C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(v) => formatInt(Number(v))}
                  labelFormatter={(l) => `${valuelabel} · ${l}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#03548C"
                  strokeWidth={2}
                  fill="url(#analyticsSeriesFill)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{emptyLabel}</p>
      )}
    </div>
  );
}

// ─── Contenedor de tabla ─────────────────────────────────────────────────────

export function ReportTableCard({
  title,
  children,
  footnote,
}: {
  title: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h4 className="px-6 pt-6 pb-3 text-sm font-semibold text-gray-900">{title}</h4>
      <div className="overflow-x-auto">{children}</div>
      {footnote && (
        <p className="border-t border-gray-100 px-6 py-2.5 text-xs text-gray-400">{footnote}</p>
      )}
    </div>
  );
}

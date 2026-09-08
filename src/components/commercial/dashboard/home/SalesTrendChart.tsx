"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardSalesTrendPoint } from "@/types/commercial/Dashboard.types";
import {
  formatCentsToCOP,
  formatCount,
  formatShortDate,
} from "./dashboard.format";
import { DashboardCard, SectionTitle } from "./dashboard.ui";

interface SalesTrendChartProps {
  trend: DashboardSalesTrendPoint[];
}

interface ChartRow {
  date: string;
  label: string;
  pesos: number;
  count: number;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-gray-900">{row.label}</p>
      <p className="mt-0.5 text-gray-600">
        {formatCentsToCOP(row.pesos * 100)}
      </p>
      <p className="text-gray-500">
        {formatCount(row.count)} {row.count === 1 ? "venta" : "ventas"}
      </p>
    </div>
  );
}

export function SalesTrendChart({ trend }: SalesTrendChartProps) {
  const data = useMemo<ChartRow[]>(
    () =>
      trend.map((point) => ({
        date: point.date,
        label: formatShortDate(point.date),
        pesos: Math.round(point.amountCents / 100),
        count: point.count,
      })),
    [trend],
  );

  const isEmpty = data.every((row) => row.pesos === 0 && row.count === 0);

  return (
    <DashboardCard>
      <SectionTitle
        title="Tendencia de ventas"
        subtitle="Monto vendido por día"
      />
      {isEmpty ? (
        <p className="py-10 text-center text-sm text-gray-400">
          Aún no tienes ventas en este periodo.
        </p>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
                }
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip cursor={{ fill: "rgba(3,84,140,0.06)" }} content={<TrendTooltip />} />
              <Bar dataKey="pesos" name="Ventas" fill="#03548C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { EarningsByMonthResponseDTO } from "@/types/transaction.types";
import * as transactionService from "@/services/TransactionService";

const MONTHS_MAP: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

interface SellerEarningsBarChartProps {
  data: EarningsByMonthResponseDTO[];
  year: number;
}

export default function SellerEarningsBarChart({
  data,
  year,
}: SellerEarningsBarChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedMonthEarnings, setSelectedMonthEarnings] =
    useState<number | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  useEffect(() => {
    setSelectedMonth(null);
    setSelectedMonthEarnings(null);
  }, [year]);

  const handleBarClick = async (month: number) => {
    try {
      setLoadingMonth(true);
      const earnings =
        await transactionService.getTotalEarningsByMonth(year, month);

      setSelectedMonth(month);
      setSelectedMonthEarnings(earnings);
    } catch (error) {
      console.error("Error loading earnings by month", error);
    } finally {
      setLoadingMonth(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Ganancias mensuales
        </h3>

        {loadingMonth ? (
          <p className="text-gray-500">Cargando detalle...</p>
        ) : selectedMonth && selectedMonthEarnings !== null ? (
          <p className="text-lg text-gray-700">
            Has ganado{" "}
            <span className="text-pink-600 font-semibold">
              ${selectedMonthEarnings.toLocaleString("es-CO")}
            </span>{" "}
            en{" "}
            <span className="font-semibold">
              {MONTHS_MAP[selectedMonth]}
            </span>
          </p>
        ) : data.length === 0 ? (
          <p className="text-gray-500">
            No se encontraron datos para este año
          </p>
        ) : (
          <p className="text-gray-500">
            Selecciona un mes para ver el detalle
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        {data.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            No se encontraron datos para el año {year}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient
                  id="earningsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#03fc39" />
                  <stop offset="50%" stopColor="#02cf2e" />
                  <stop offset="100%" stopColor="#02a224" />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="month"
                tickFormatter={(m: number) =>
                  MONTHS_MAP[m]?.slice(0, 3)
                }
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(v) => `$${v / 1000}k`}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                  fontSize: "14px",
                }}
                formatter={(value) =>
                  `$${Number(value).toLocaleString("es-CO")}`
                }
                labelFormatter={(label) =>
                  MONTHS_MAP[label as number] ?? ""
                }
              />

              <Bar
                dataKey="earnings"
                fill="url(#earningsGradient)"
                radius={[8, 8, 0, 0]}
                className="cursor-pointer"
                onClick={(e) =>
                  handleBarClick(
                    (e.payload as EarningsByMonthResponseDTO).month
                  )
                }
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

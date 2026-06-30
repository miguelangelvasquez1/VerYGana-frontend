"use client";

import { useEffect, useState } from "react";

import CommercialPayoutsList from "@/components/commercial/products/commercialStats/CommercialPayoutsList";
import CommercialEarningsBarChart from "@/components/commercial/products/commercialStats/CommercialEarningsBarChart";
import CommercialEarningsCards from "@/components/commercial/products/commercialStats/CommercialEarningsCards";

import { EarningsByMonthResponseDTO } from "@/types/transaction.types";
import * as transactionService from "@/services/TransactionService";

interface SalesAnalyticsProps {
  dateRange?: string;
}

export default function SalesAnalytics({ dateRange }: SalesAnalyticsProps) {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedPayoutMonth, setSelectedPayoutMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  const [earningsByMonth, setEarningsByMonth] = useState<
    EarningsByMonthResponseDTO[]
  >([]);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const MONTHS = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  // ================== LOAD DATA ==================
  const loadEarningsByYear = async (year: number) => {
    setEarningsLoading(true);
    try {
      const data =
        await transactionService.getCommercialEarningsByYearList(year);
      setEarningsByMonth(data);
    } catch (error) {
      console.error("Error loading earnings", error);
    } finally {
      setEarningsLoading(false);
    }
  };

  // ================== EFFECT ==================
  useEffect(() => {
    loadEarningsByYear(selectedYear);
  }, [selectedYear]);

  // ================== UI ==================
  return (
    <div className="flex flex-col gap-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Análisis de Ventas
          </h2>
          <p className="text-gray-600">
            Ganancias mensuales del {selectedYear}
          </p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border rounded-lg px-4 py-2 w-full sm:w-32"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* LOADING */}
      {earningsLoading ? (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* GRÁFICO */}
          <div className="bg-white rounded-xl shadow p-4">
            <CommercialEarningsBarChart
              data={earningsByMonth}
              year={selectedYear}
            />
          </div>
        </>
      )}
    </div>
  );
}
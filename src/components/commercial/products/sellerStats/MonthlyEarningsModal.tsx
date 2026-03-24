"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import * as purchaseItemService from "@/services/PurchaseItemService";
import * as sellerService from "@/services/SellerService";

import { MonthlyReportResponseDTO } from "@/types/Seller.types";

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

interface Props {
  year: number;
  month: number;
  onClose: () => void;
}

export default function MonthlyEarningsModal({
  year,
  month,
  onClose,
}: Props) {
  const [report, setReport] = useState<MonthlyReportResponseDTO | null>(null);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sales, monthlyReport] = await Promise.all([
          purchaseItemService.getTotalSellerSalesByMonth(year, month),
          sellerService.getMonthlyReport(year, month),
        ]);

        setTotalSales(sales);
        setReport(monthlyReport);
      } catch (error) {
        console.error("Error loading monthly report", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, month]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X />
        </button>

        <h3 className="text-2xl font-bold text-gray-900">
          Reporte {MONTHS_MAP[month]} {year}
        </h3>

        {loading || !report ? (
          <p className="mt-6 text-gray-500">Cargando reporte...</p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Ventas realizadas</span>
              <span className="font-semibold">{totalSales}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Ingresos del vendedor</span>
              <span className="font-semibold text-green-600">
                ${report.earnings.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Comisión de la plataforma
              </span>
              <span className="font-semibold text-red-500">
                ${report.totalPlatformCommissionsAmount.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="border-t pt-4 flex justify-between text-lg font-bold">
              <span>Total vendido</span>
              <span>
                ${report.totalSalesAmount.toLocaleString("es-CO")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

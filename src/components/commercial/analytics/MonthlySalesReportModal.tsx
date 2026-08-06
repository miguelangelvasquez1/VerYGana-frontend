"use client";

import { X, TrendingUp, ShoppingBag, Percent, Star, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SalesReportResponseDTO } from "@/types/Commercial.types";

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

const formatCurrency = (value: number) => `$${value.toLocaleString("es-CO")}`;

interface StatBlockProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  bg: string;
}

function StatBlock({ icon: Icon, label, value, color, bg }: StatBlockProps) {
  return (
    <div className={`rounded-xl p-3.5 ${bg}`}>
      <Icon className={`w-4 h-4 mb-2 ${color}`} />
      <p className="text-lg font-extrabold text-gray-900 leading-none truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

interface MonthlySalesReportModalProps {
  report: SalesReportResponseDTO;
  onClose: () => void;
}

export default function MonthlySalesReportModal({
  report,
  onClose,
}: MonthlySalesReportModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-5 rounded-t-3xl text-white"
          style={{ background: "linear-gradient(135deg, #0b1440, #03548C)" }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">
            Reporte mensual
          </p>
          <h3 className="text-2xl font-extrabold mt-1">
            {MONTHS_MAP[report.month] ?? report.month} {report.year}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatBlock
              icon={TrendingUp}
              label="Total vendido"
              value={formatCurrency(report.totalSalesAmount)}
              color="text-[#03548C]"
              bg="bg-blue-50"
            />
            <StatBlock
              icon={ShoppingBag}
              label="Ventas realizadas"
              value={report.totalSalesCount.toLocaleString("es-CO")}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatBlock
              icon={Percent}
              label="Comisión plataforma"
              value={formatCurrency(report.totalPlatformCommissionsAmount)}
              color="text-red-500"
              bg="bg-red-50"
            />
          </div>

          {/* Top selling products */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              Productos más vendidos este mes
            </h4>

            {report.topSellingProducts.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin productos vendidos este mes.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {report.topSellingProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {p.averageRate.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</p>
                      <p className="text-xs text-gray-400">{p.totalSales} vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

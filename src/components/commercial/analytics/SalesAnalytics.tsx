"use client";

import { useEffect, useState, lazy, Suspense } from 'react';
import TableScroll from '@/components/shared/TableScroll';
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShoppingBag, History, Star, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { usePlanState } from "@/components/commercial/layout/DashboardLayout";
import { PlanCode } from "@/types/finance/plans/Plan.types";

import TopSellingProducts from "@/components/commercial/products/commercialStats/TopSellingProducts";
import { MetricStatCard } from "./MetricStatCard";
import * as commercialService from "@/services/commercial/commercialService";
import { getTotalCommercialSales } from "@/services/PurchaseItemService";
import { useAuth } from "@/hooks/useAuth";
import { SalesReportResponseDTO, DailySaleResponseDTO } from "@/types/Commercial.types";
import { PagedResponse } from "@/types/Generic.types";
import type { DateRangeFilter } from "./analytics.types";

// Se carga al abrirlo: no entra en el JavaScript inicial de la página (RN-8 de la spec 014). Con `lazy` de React,
// que no suma el cargador de `next/dynamic` al paquete.
const MonthlySalesReportModal = lazy(() => import('./MonthlySalesReportModal'));

interface SalesAnalyticsProps {
  dateRange: DateRangeFilter;
}

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

const currentYear = new Date().getFullYear();
const DAILY_SALES_PAGE_SIZE = 10;

const formatCurrency = (value: number) => `$${value.toLocaleString("es-CO")}`;

const formatCents = (cents: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(cents / 100);

export default function SalesAnalytics({ dateRange }: SalesAnalyticsProps) {
  const { user } = useAuth();
  const commercialPublicId = user?.publicId;
  const { planState } = usePlanState();
  const isStandard = planState?.effectivePlan === PlanCode.STANDARD;

  // ================== VENTAS TOTALES (rango de fechas) ==================
  const [openCoverageHint, setOpenCoverageHint] = useState<number | null>(null);
  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [salesCountLoading, setSalesCountLoading] = useState(false);

  // ================== VENTAS TOTALES HISTÓRICAS + RESEÑAS ==================
  const [historicalSalesCount, setHistoricalSalesCount] = useState<number | null>(null);
  const [historicalSalesLoading, setHistoricalSalesLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [reviewCountLoading, setReviewCountLoading] = useState(false);

  // ================== REPORTE DE VENTAS (gráfico de barras) ==================
  const [reportYear, setReportYear] = useState(currentYear);
  const [salesReport, setSalesReport] = useState<SalesReportResponseDTO[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SalesReportResponseDTO | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // ================== LISTADO DE VENTAS DIARIAS ==================
  const [dailyPage, setDailyPage] = useState(0);
  const [dailySales, setDailySales] = useState<PagedResponse<DailySaleResponseDTO> | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    setSalesCountLoading(true);
    commercialService
      .getSalesCountByDateRange(dateRange.startDate, dateRange.endDate)
      .then(setSalesCount)
      .catch(() => console.error("No se pudo cargar el conteo de ventas"))
      .finally(() => setSalesCountLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    setHistoricalSalesLoading(true);
    getTotalCommercialSales()
      .then(setHistoricalSalesCount)
      .catch(() => console.error("No se pudo cargar el conteo histórico de ventas"))
      .finally(() => setHistoricalSalesLoading(false));
  }, []);

  useEffect(() => {
    if (!commercialPublicId) return;
    setReviewCountLoading(true);
    commercialService
      .getCommercialProfile(commercialPublicId)
      .then((profile) => setReviewCount(profile.reviewCount))
      .catch(() => console.error("No se pudo cargar el conteo de reseñas"))
      .finally(() => setReviewCountLoading(false));
  }, [commercialPublicId]);
  useEffect(() => {
    setReportLoading(true);
    commercialService
      .getAnuallySalesReport(reportYear)
      .then((data) => setSalesReport([...data].sort((a, b) => a.month - b.month)))
      .catch(() => console.error("No se pudo cargar el reporte de ventas"))
      .finally(() => setReportLoading(false));
  }, [reportYear]);

  useEffect(() => {
    setDailyPage(0);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    setDailyLoading(true);
    commercialService
      .getDailySales(dateRange.startDate, dateRange.endDate, dailyPage, DAILY_SALES_PAGE_SIZE)
      .then(setDailySales)
      .catch(() => console.error("No se pudo cargar las ventas diarias"))
      .finally(() => setDailyLoading(false));
  }, [dateRange.startDate, dateRange.endDate, dailyPage]);

  return (
    <div className="space-y-6">

      {/* CARDS DE RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricStatCard
          title="Ventas totales históricas"
          value={
            historicalSalesLoading
              ? "…"
              : historicalSalesCount != null
              ? historicalSalesCount.toLocaleString("es-CO")
              : "—"
          }
          icon={History}
          subtitle="Desde que empezaste en la plataforma"
        />
        <MetricStatCard
          title="Ventas totales"
          value={
            salesCountLoading
              ? "…"
              : salesCount != null
              ? salesCount.toLocaleString("es-CO")
              : "—"
          }
          icon={ShoppingBag}
          subtitle={`Del ${dateRange.startDate} al ${dateRange.endDate}`}
        />
        <MetricStatCard
          title="Reseñas"
          value={
            reviewCountLoading
              ? "…"
              : reviewCount != null
              ? reviewCount.toLocaleString("es-CO")
              : "—"
          }
          icon={Star}
          subtitle="Reseñas recibidas en tus productos"
        />
      </div>

      {/* LISTADO DE VENTAS DIARIAS */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Listado de ventas</h3>

        {dailyLoading ? (
          <p className="text-center text-gray-500 py-8">Cargando ventas...</p>
        ) : (
          <>
            <TableScroll label="Tabla de ventas por día, desplazable">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Producto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Entregado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Subtotal</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Comisión</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {!dailySales?.data?.length ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                        No hay ventas para el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    dailySales.data.map((sale) => (
                      <tr key={sale.purchaseItemId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{sale.productName}</td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {new Date(sale.deliveredAt).toLocaleDateString("es-CO")}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 whitespace-nowrap">
                          {formatCents(sale.subtotalCents)}
                        </td>
                        {isStandard && sale.commissionCents === 0 ? (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {/* La ayuda se abre y se cierra con un toque (RN-2); `title` queda para el puntero */}
                            <button
                              type="button"
                              title="Comisión cubierta por tu Saldo de Prosperidad"
                              aria-label="Comisión cubierta por tu Saldo de Prosperidad"
                              aria-expanded={openCoverageHint === sale.purchaseItemId}
                              onClick={() =>
                                setOpenCoverageHint((current) =>
                                  current === sale.purchaseItemId ? null : sale.purchaseItemId,
                                )
                              }
                              className="inline-flex items-center gap-1 text-gray-600 cursor-help tap"
                            >
                              {formatCents(0)}
                              <Info className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            {openCoverageHint === sale.purchaseItemId && (
                              <span className="block whitespace-normal text-right text-xs text-emerald-700">
                                Comisión cubierta por tu Saldo de Prosperidad
                              </span>
                            )}
                          </td>
                        ) : (
                          <td className="py-3 px-4 text-right text-red-500 whitespace-nowrap">
                            -{formatCents(sale.commissionCents)}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right font-semibold text-green-600 whitespace-nowrap">
                          {formatCents(sale.netToCommercialCents)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScroll>

            {dailySales && dailySales.meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {dailySales.meta.totalElements} registros · Página {dailySales.meta.page + 1} de{" "}
                  {Math.max(dailySales.meta.totalPages, 1)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDailyPage((p) => p - 1)}
                    disabled={!dailySales.meta.hasPrevious}
                    className="p-1.5 max-lg:flex tap-sq max-lg:items-center max-lg:justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDailyPage((p) => p + 1)}
                    disabled={!dailySales.meta.hasNext}
                    className="p-1.5 max-lg:flex tap-sq max-lg:items-center max-lg:justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* REPORTE DE VENTAS */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ganancias por mes</h3>
            <p className="text-sm text-gray-500">
              Ventas totales de cada mes del año seleccionado · haz clic en una barra para ver el detalle
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 tap text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {reportLoading ? (
          <p className="text-center text-gray-500 py-10">Cargando reporte...</p>
        ) : salesReport.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No se encontraron ventas para el año seleccionado.
          </p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesReport}>
                <defs>
                  <linearGradient id="salesBarHoverGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00a4ff" />
                    <stop offset="100%" stopColor="#0089d6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: number) => MONTHS.find((mo) => mo.value === m)?.label.slice(0, 3) ?? String(m)}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={false}
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => MONTHS.find((mo) => mo.value === Number(label))?.label ?? String(label)}
                  contentStyle={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "14px",
                  }}
                />
                <Bar
                  dataKey="totalSalesAmount"
                  name="Ventas"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => setSelectedReport(data.payload as SalesReportResponseDTO)}
                  onMouseEnter={(_: any, index: number) => setHoveredBarIndex(index)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  shape={(props: any) => (
                    <Rectangle
                      {...props}
                      fill={hoveredBarIndex === props.index ? "url(#salesBarHoverGradient)" : "#03548C"}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* PRODUCTOS MÁS VENDIDOS (movido desde ProductsDashboard) */}
      <TopSellingProducts />

      {selectedReport && (
        <Suspense fallback={null}>
          <MonthlySalesReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

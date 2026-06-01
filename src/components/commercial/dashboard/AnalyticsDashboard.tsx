"use client";

import React, { useState } from "react";
import { PerformanceChart } from "../analytics/PerformanceChart";
import { Calendar, Download, Filter } from "lucide-react";
import SalesAnalytics from "../analytics/SalesAnalytics";
import AdsTable from "../analytics/AdsTable";

type MetricType = "all" | "impressions" | "clicks" | "ctr" | "sales";

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("7days");
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>("all");

  // ================== RENDER CONTENT ==================
  const renderContent = () => {
    switch (selectedMetric) {
      case "sales":
        return <SalesAnalytics dateRange={dateRange}/>;

      case "impressions":
      case "clicks":
      case "ctr":
        return <PerformanceChart metric={selectedMetric} dateRange={dateRange}/>;

      case "all":
      default:
        return (
          <>
            <PerformanceChart dateRange={dateRange}/>
            <AdsTable dateRange={dateRange}/>
            <SalesAnalytics dateRange={dateRange}/>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* ================== CONTROLES ================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex flex-col sm:flex-row gap-4">

            {/* DATE RANGE */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">Últimos 7 días</option>
                <option value="30days">Últimos 30 días</option>
                <option value="90days">Últimos 3 meses</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </div>

            {/* METRIC FILTER */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedMetric}
                onChange={(e) =>
                  setSelectedMetric(e.target.value as MetricType)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las métricas</option>
                <option value="impressions">Solo impresiones</option>
                <option value="clicks">Solo clicks</option>
                <option value="ctr">Solo CTR</option>
                <option value="sales">Solo ventas</option>
              </select>
            </div>

          </div>

          {/* EXPORT BUTTON */}
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
          </button>
        </div>
      </div>

      {/* ================== CONTENIDO DINÁMICO ================== */}
      <div className="space-y-6">
        {renderContent()}
      </div>

    </div>
  );
}
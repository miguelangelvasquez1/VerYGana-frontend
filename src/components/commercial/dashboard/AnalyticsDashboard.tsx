// components/analytics/AnalyticsDashboard.tsx
'use client';

import React, { useState } from 'react';
import { PerformanceChart } from './PerformanceChart';
import { Calendar, Download, Filter } from 'lucide-react';

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('all');

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
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

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las métricas</option>
                <option value="impressions">Solo impresiones</option>
                <option value="clicks">Solo clicks</option>
                <option value="ctr">Solo CTR</option>
              </select>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <PerformanceChart />

      {/* Tabla de rendimiento por anuncio */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Anuncio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Anuncio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Impresiones</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Clicks</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">CTR</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Gasto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Promoción Black Friday</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                </td>
                <td className="py-3 px-4">15,430</td>
                <td className="py-3 px-4">847</td>
                <td className="py-3 px-4">5.49%</td>
                <td className="py-3 px-4">$245.80</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Producto Verano</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pausado</span>
                </td>
                <td className="py-3 px-4">8,920</td>
                <td className="py-3 px-4">267</td>
                <td className="py-3 px-4">2.99%</td>
                <td className="py-3 px-4">$123.45</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

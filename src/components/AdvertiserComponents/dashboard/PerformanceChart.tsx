// components/analytics/PerformanceChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const performanceData = [
  { date: '01/11', impresiones: 2400, clicks: 240, gasto: 120 },
  { date: '02/11', impresiones: 1398, clicks: 139, gasto: 98 },
  { date: '03/11', impresiones: 9800, clicks: 490, gasto: 245 },
  { date: '04/11', impresiones: 3908, clicks: 195, gasto: 156 },
  { date: '05/11', impresiones: 4800, clicks: 288, gasto: 189 },
  { date: '06/11', impresiones: 3800, clicks: 190, gasto: 167 },
  { date: '07/11', impresiones: 4300, clicks: 258, gasto: 198 }
];

export function PerformanceChart() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Rendimiento Semanal</h3>
        <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
          <option>Últimos 7 días</option>
          <option>Últimos 30 días</option>
          <option>Últimos 3 meses</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Impresiones y Clicks</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="impresiones" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Gasto Diario</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="gasto" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

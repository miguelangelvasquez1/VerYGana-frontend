// components/analytics/PerformanceChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

type MetricType = "impressions" | "clicks" | "ctr";

interface PerformanceChartProps {
  metric?: MetricType;
  dateRange?: string;
}

const performanceData = [
  { date: '01/11', impresiones: 2400, clicks: 240, gasto: 120 },
  { date: '02/11', impresiones: 1398, clicks: 139, gasto: 98 },
  { date: '03/11', impresiones: 9800, clicks: 490, gasto: 245 },
  { date: '04/11', impresiones: 3908, clicks: 195, gasto: 156 },
  { date: '05/11', impresiones: 4800, clicks: 288, gasto: 189 },
  { date: '06/11', impresiones: 3800, clicks: 190, gasto: 167 },
  { date: '07/11', impresiones: 4300, clicks: 258, gasto: 198 }
];

export function PerformanceChart({ metric, dateRange }: PerformanceChartProps) {

  const getTitle = () => {
    switch (metric) {
      case "impressions":
        return "Impresiones";
      case "clicks":
        return "Clicks";
      case "ctr":
        return "CTR";
      default:
        return "Rendimiento General";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {getTitle()} ({dateRange})
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE CHART */}
        {(metric === "impressions" ||
          metric === "clicks" ||
          !metric) && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Impresiones y Clicks
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {(metric === "impressions" || !metric) && (
                  <Line
                    type="monotone"
                    dataKey="impresiones"
                    stroke="#3B82F6"
                  />
                )}
                {(metric === "clicks" || !metric) && (
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10B981"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* BAR CHART */}
        {(metric === "ctr" || !metric) && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Gasto
            </h4>
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
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Eye, MousePointer, DollarSign, Clock } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

function StatsCard({ title, value, change, changeType, icon: Icon }: StatsCardProps) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm ${changeColor} mt-1`}>{change}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Impresiones Totales"
        value="45,231"
        change="+12.5% vs mes anterior"
        changeType="positive"
        icon={Eye}
      />
      <StatsCard
        title="Clicks Totales"
        value="2,847"
        change="+8.2% vs mes anterior"
        changeType="positive"
        icon={MousePointer}
      />
      <StatsCard
        title="Gasto Total"
        value="$1,847.50"
        change="+15.3% vs mes anterior"
        changeType="neutral"
        icon={DollarSign}
      />
      <StatsCard
        title="Anuncios Pendientes"
        value="3"
        change="2 en revisión"
        changeType="neutral"
        icon={Clock}
      />
    </div>
  );
}

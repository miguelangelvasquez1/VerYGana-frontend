import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
}

// Tarjeta de estadística reutilizada por todas las secciones del panel de
// analíticas. Mientras no haya endpoint conectado, `value` se pasa como "—".
export function MetricStatCard({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-[#03548C]/10',
  iconColor = 'text-[#03548C]',
  subtitle,
}: MetricStatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

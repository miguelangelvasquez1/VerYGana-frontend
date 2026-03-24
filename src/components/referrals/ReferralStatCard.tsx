'use client';

import { LucideIcon } from 'lucide-react';

interface ReferralStatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badge?: string;
}

export default function ReferralStatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  badge,
}: ReferralStatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {badge && (
          <span className="text-sm text-blue-600 font-medium">{badge}</span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}